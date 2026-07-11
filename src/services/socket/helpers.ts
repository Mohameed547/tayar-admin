import { useEffect, useRef } from "react";
import { useSocket } from "./socket-context";

/**
 * Reusable hook to subscribe to socket events.
 * Handles lifecycle registrations automatically.
 */
export function useSocketEvent<T>(
  event: string,
  callback: (data: T) => void,
  _deps?: React.DependencyList
) {
  const { registerListener } = useSocket();
  const callbackRef = useRef<(data: T) => void>(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handleEvent = (data: T) => {
      if (callbackRef.current) {
        callbackRef.current(data);
      }
    };

    const unsubscribe = registerListener<T>(event, handleEvent);
    return () => {
      unsubscribe();
    };
  }, [event, registerListener]);
}

/**
 * Reusable hook to listen to general notifications.
 */
export function useNotificationsListener(onNotification: (data: any) => void) {
  useSocketEvent<any>("newNotification", onNotification);
}
