'use client';

import { useEffect, useState } from "react";

export default function Home() {
    const [text, setText] = useState('');

    useEffect(() => {
        let running = true;
        const fetchStream = async () => {
            const response = await fetch('http://localhost:8000/api/stream');
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            while (running) {
                const { done, value } = await reader!.read();
                if (done) break;
                const chunk = decoder.decode(value);
                setText((prevText) => prevText + chunk);
            }
        };

        fetchStream();
        return () => { running = false; };
    }, []);

    return (
        <div>
            <h1>Streaming Text</h1>
            <p>{text}</p>
        </div>
    );
}
