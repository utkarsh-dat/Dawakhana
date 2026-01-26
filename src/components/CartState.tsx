"use client";

import React, { useState } from "react";
import Header from "./Header";
import CartDrawer from "./CartDrawer";

const CartState = () => {
    const [isCartOpen, setIsCartOpen] = useState(false);

    return (
        <>
            <Header onCartClick={() => setIsCartOpen(true)} />
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </>
    );
};

export default CartState;
