"use client";
import dynamic from "next/dynamic";

const IDE = dynamic(() => import("../../components/IDE"), { ssr: false });

export default function Page() {
    return <IDE />;
}
