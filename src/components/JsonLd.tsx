

export default function JsonLd() {
    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "DawaKhana",
        "url": "https://dawakhana.netlify.app",
        "logo": "https://dawakhana.netlify.app/images/logo.png",
        "description": "Your trusted online pharmacy for authentic medicines",
        "contactPoint": {
            "@type": "ContactPoint",
            "email": "utkarshparmar2367@gmail.com",
            "contactType": "customer service"
        },
        "sameAs": [
            "https://facebook.com/dawakhana",
            "https://twitter.com/dawakhana",
            "https://instagram.com/dawakhana.011"
        ]
    };

    const localBusinessSchema = {
        "@context": "https://schema.org",
        "@type": "Pharmacy",
        "name": "DawaKhana Online Pharmacy",
        "image": "https://dawakhana.netlify.app/images/logo.png",
        "url": "https://dawakhana.netlify.app",
        "description": "DawaKhana - Your trusted online pharmacy for authentic medicines. Buy cardiac, diabetic, psychiatric medicines at best prices.",
        "priceRange": "₹₹",
        "address": {
            "@type": "PostalAddress",
            "addressCountry": "IN"
        },
        "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday"
            ],
            "opens": "00:00",
            "closes": "23:59"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.5",
            "reviewCount": "500"
        }
    };

    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "DawaKhana",
        "url": "https://dawakhana.netlify.app",
        "potentialAction": {
            "@type": "SearchAction",
            "target": "https://dawakhana.netlify.app/catalog?search={search_term_string}",
            "query-input": "required name=search_term_string"
        }
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
            />
        </>
    );
}
