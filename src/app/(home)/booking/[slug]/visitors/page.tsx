import React from "react";
import VisitorDetailsPage from "../_components/VisitorDetailsPage";

interface VisitorDetailsRouteProps {
    params: Promise<{
        slug: string;
    }>;
}

function VisitorDetailsRoute({ params }: VisitorDetailsRouteProps) {
    return <VisitorDetailsPage />;
}

export default VisitorDetailsRoute;

