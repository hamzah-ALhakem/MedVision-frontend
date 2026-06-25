import React, { createContext, useContext, useEffect, useState } from 'react';
import Pusher from 'pusher-js';
import { useAuth } from './AuthContext';

const PusherContext = createContext();

export const PusherProvider = ({ children }) => {
    const { user, token } = useAuth();
    const [pusherClient, setPusherClient] = useState(null);
    const [channel, setChannel] = useState(null);

    useEffect(() => {
        if (!user || !token) {
            if (pusherClient) {
                pusherClient.disconnect();
                setPusherClient(null);
                setChannel(null);
            }
            return;
        }

        // Initialize Pusher
        const pusher = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
            cluster: import.meta.env.VITE_PUSHER_CLUSTER,
        });

        setPusherClient(pusher);

        // Subscribe to user-specific channel
        const userChannel = pusher.subscribe(`user_${user.id}`);
        setChannel(userChannel);

        return () => {
            userChannel.unbind_all();
            pusher.unsubscribe(`user_${user.id}`);
            pusher.disconnect();
        };
    }, [user, token]);

    return (
        <PusherContext.Provider value={{ pusherClient, channel }}>
            {children}
        </PusherContext.Provider>
    );
};

export const usePusher = () => useContext(PusherContext);
