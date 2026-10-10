"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { X, Play, Square, CheckCircle, Wifi, Database } from "lucide-react";
import { motion } from "framer-motion";
import { Order } from "@/lib/types";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// Dynamically import React-Leaflet components to disable SSR and prevent compilation issues
const MapContainer = dynamic(
    () => import("react-leaflet").then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import("react-leaflet").then((mod) => mod.TileLayer),
    { ssr: false }
);
const Marker = dynamic(
    () => import("react-leaflet").then((mod) => mod.Marker),
    { ssr: false }
);
const Popup = dynamic(
    () => import("react-leaflet").then((mod) => mod.Popup),
    { ssr: false }
);

interface TrackingModalProps {
    order: Order;
    onClose: () => void;
}

export default function TrackingModal({ order, onClose }: TrackingModalProps) {
    const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
    const [simulating, setSimulating] = useState(false);
    const [logs, setLogs] = useState<{ time: string; msg: string; type: "info" | "success" | "error" }[]>([]);
    
    // State matching MapView.js from the repository
    const [markers, setMarkers] = useState<{ lat: number; lng: number }[]>([
        { lat: 19.0760, lng: 72.8777 } // Default Customer Delivery Marker
    ]);
    const [riderLocation, setRiderLocation] = useState<[number, number] | null>([19.0820, 72.8680]);

    const socketRef = useRef<WebSocket | null>(null);
    const simIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const addLog = (msg: string, type: "info" | "success" | "error" = "info") => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [{ time, msg, type }, ...prev].slice(0, 15));
    };

    // Configure default Leaflet Marker Icons dynamically
    useEffect(() => {
        import("leaflet").then((L) => {
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            });
        });
    }, []);

    // API: Fetch initial tracking info on mount
    useEffect(() => {
        const fetchInitialTracking = async () => {
            try {
                addLog("Fetching initial coordinates from API...", "info");
                const response = await fetch(`/api/tracking/${order.id}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.riderLocation) {
                        setRiderLocation([data.riderLocation.lat, data.riderLocation.lng]);
                        addLog("Loaded rider position from database", "success");
                    }
                    if (data.markers && data.markers.length > 0) {
                        setMarkers(data.markers);
                        addLog(`Loaded ${data.markers.length} route markers`, "success");
                    }
                }
            } catch (err) {
                console.error("Failed to load initial tracking from API:", err);
                addLog("Could not reach tracking API database.", "error");
            }
        };

        fetchInitialTracking();
    }, [order.id]);

    // WebSocket connection using the exact code structure provided
    useEffect(() => {
        const clusterId = process.env.NEXT_PUBLIC_PIESOCKET_CLUSTER_ID;
        const apiKey = process.env.NEXT_PUBLIC_PIESOCKET_API_KEY;
        if (!clusterId || !apiKey) {
            addLog("Real-time tracking is not configured.", "error");
            return;
        }
        const roomId = `order_${order.id}`;
        const wsUrl = `wss://${clusterId}.piesocket.com/v3/${roomId}?api_key=${apiKey}`;

        addLog(`Connecting to WebSocket server...`, "info");
        
        // Exact WebSocket instantiation from user example
        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        // When connection is successful
        socket.onopen = () => {
            console.log("Successfully connected to the real-time server!");
            setStatus("connected");
            addLog("Successfully connected to the real-time server!", "success");
        };

        // When a message (like rider location) is received
        socket.onmessage = (event) => {
            console.log("New update:", event.data);
            addLog(`New update: ${event.data}`, "success");
            try {
                const data = JSON.parse(event.data);
                if (data.lat && data.lng) {
                    setRiderLocation([data.lat, data.lng]);
                }
            } catch (err) {
                // Support raw string coordinates (e.g. "19.0820,72.8680")
                const parts = event.data.split(",");
                if (parts.length === 2) {
                    const lat = parseFloat(parts[0]);
                    const lng = parseFloat(parts[1]);
                    if (!isNaN(lat) && !isNaN(lng)) {
                        setRiderLocation([lat, lng]);
                    }
                }
            }
        };

        socket.onerror = () => {
            addLog(`WebSocket connection error.`, "error");
        };

        socket.onclose = () => {
            setStatus("disconnected");
            addLog("Disconnected from WebSocket server.", "error");
        };

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
            if (simIntervalRef.current) {
                clearInterval(simIntervalRef.current);
            }
        };
    }, [order.id]);

    const startSimulation = () => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
            alert("Waiting for WebSocket connection. Please try again.");
            return;
        }

        setSimulating(true);
        addLog("Rider started journey. Simulating steps...", "info");

        // Starting point
        let currentLat = 19.0820;
        let currentLng = 72.8680;
        setRiderLocation([currentLat, currentLng]);

        const steps = 15;
        let step = 0;
        const targetLat = 19.0760;
        const targetLng = 72.8777;

        const dLat = (targetLat - currentLat) / steps;
        const dLng = (targetLng - currentLng) / steps;

        simIntervalRef.current = setInterval(() => {
            step++;
            if (step > steps) {
                stopSimulation();
                addLog("Rider has arrived at the destination!", "success");
                return;
            }

            currentLat += dLat;
            currentLng += dLng;

            const payload = {
                lat: parseFloat(currentLat.toFixed(6)),
                lng: parseFloat(currentLng.toFixed(6))
            };

            // Call API endpoint to update location in database (loose coupling via backend endpoint)
            fetch(`/api/tracking/${order.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            }).then(res => {
                if (res.ok) {
                    addLog("Database coordinates updated via API", "info");
                }
            }).catch(e => {
                console.error("API update failed:", e);
            });

            // Call API endpoint to add route marker historically
            if (step % 3 === 0) {
                fetch(`/api/tracking/${order.id}/markers`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                }).then(res => {
                    if (res.ok) {
                        addLog("Route marker saved to database via API", "info");
                        setMarkers(prev => [...prev, payload]);
                    }
                }).catch(e => {
                    console.error("API marker post failed:", e);
                });
            }

            // Broadcast real-time update over WebSocket
            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                addLog(`Broadcasting rider location: [${payload.lat}, ${payload.lng}]`, "info");
                socketRef.current.send(JSON.stringify(payload));
            }
        }, 3000);
    };

    const stopSimulation = () => {
        if (simIntervalRef.current) {
            clearInterval(simIntervalRef.current);
            simIntervalRef.current = null;
        }
        setSimulating(false);
    };

    // --- Memoization block to maximize frontend efficiency ---

    // Memoize the markers list to prevent re-creation on every render
    const markersElements = useMemo(() => {
        return markers.map((marker, idx) => (
            <Marker key={idx} position={[marker.lat, marker.lng]}>
                <Popup>
                    Customer Address at [{marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}]
                </Popup>
            </Marker>
        ));
    }, [markers]);

    // Memoize rider marker to prevent unnecessary DOM updates
    const riderMarkerElement = useMemo(() => {
        if (!riderLocation) return null;
        return (
            <Marker position={riderLocation}>
                <Popup>
                    Rider Location at [{riderLocation[0].toFixed(4)}, {riderLocation[1].toFixed(4)}]
                </Popup>
            </Marker>
        );
    }, [riderLocation]);

    // Memoize order details section (static for modal session)
    const orderDetailsSection = useMemo(() => (
        <div className="p-6 bg-white border-b border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-500/10 text-teal-600 rounded-xl flex items-center justify-center">
                    <CheckCircle size={20} />
                </div>
                <div>
                    <p className="text-xs text-slate-400 font-medium">Order Status</p>
                    <p className="font-bold text-slate-800">{order.status}</p>
                </div>
            </div>
            <div className="space-y-1">
                <p className="text-xs text-slate-400 font-medium">Deliver to</p>
                <p className="text-sm font-bold text-slate-800">
                    {order.address.firstName} {order.address.lastName}
                </p>
                <p className="text-xs text-slate-500 leading-normal">
                    {order.address.address}
                </p>
            </div>
        </div>
    ), [order.status, order.address]);

    // Memoize logs console output to prevent layout recalculations on unaffected elements
    const logsListElement = useMemo(() => {
        if (logs.length === 0) {
            return (
                <div className="text-slate-500 italic text-center pt-8">
                    No socket messages yet.<br/>Start simulation or wait for updates.
                </div>
            );
        }
        return logs.map((log, i) => (
            <div key={i} className="flex gap-2 leading-relaxed">
                <span className="text-slate-500 flex-shrink-0">[{log.time}]</span>
                <span className={
                    log.type === "success" ? "text-green-400" :
                    log.type === "error" ? "text-red-400" : "text-cyan-400"
                }>
                    {log.msg}
                </span>
            </div>
        ));
    }, [logs]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white w-full max-w-4xl rounded-[2rem] overflow-hidden shadow-2xl flex flex-col md:flex-row h-[90vh] max-h-[750px]"
            >
                {/* Left Side: Map and Controls */}
                <div className="flex-1 flex flex-col h-1/2 md:h-full relative">
                    <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-md border border-slate-100 flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${
                            status === "connected" ? "bg-green-500 animate-pulse" : 
                            status === "connecting" ? "bg-yellow-500 animate-pulse" : "bg-red-500"
                        }`} />
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Wifi size={12} />
                            {status}
                        </span>
                    </div>

                    {/* Map container rendering react-leaflet components */}
                    <div className="w-full flex-grow bg-slate-100 h-full relative z-0">
                        <MapContainer 
                            center={[19.0760, 72.8777]} 
                            zoom={13} 
                            style={{ height: "100%", width: "100%" }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            
                            {/* Render memoized customer markers */}
                            {markersElements}
                            
                            {/* Render memoized rider marker location */}
                            {riderMarkerElement}
                        </MapContainer>
                    </div>
                    
                    {/* Floating simulation controls */}
                    <div className="absolute bottom-4 left-4 right-4 md:right-auto z-[1000] bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-100 flex flex-col sm:flex-row gap-3 items-center">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Rider Simulation</p>
                            <p className="text-sm font-semibold text-slate-700">Test live socket communication</p>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            {!simulating ? (
                                <button
                                    onClick={startSimulation}
                                    className="flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-teal-500/10 transition-colors w-full sm:w-auto animate-pulse"
                                >
                                    <Play size={16} fill="white" />
                                    Start Sim
                                </button>
                            ) : (
                                <button
                                    onClick={stopSimulation}
                                    className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-red-500/10 transition-colors w-full sm:w-auto"
                                >
                                    <Square size={16} fill="white" />
                                    Stop Sim
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side: Order Info & Console Logs */}
                <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-100 flex flex-col h-1/2 md:h-full bg-slate-50">
                    {/* Header */}
                    <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-lg text-slate-800">Track Order</h3>
                            <p className="text-xs text-slate-400">Order #{order.id.slice(0, 8)}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Render memoized order details */}
                    {orderDetailsSection}

                    {/* WebSocket Log Console */}
                    <div className="flex-grow flex flex-col min-h-0">
                        <div className="px-6 py-4 bg-slate-100/50 border-b border-slate-200/50 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Database size={12} />
                                WebSocket Console
                            </span>
                            <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                                Live Logs
                            </span>
                        </div>
                        <div className="flex-grow overflow-y-auto p-6 font-mono text-[10px] space-y-3 bg-slate-950 text-slate-300 select-all scrollbar-thin">
                            {/* Render memoized log console items */}
                            {logsListElement}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
