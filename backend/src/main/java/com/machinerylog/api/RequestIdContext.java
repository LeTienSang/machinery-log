package com.machinerylog.api;

public final class RequestIdContext {
    private static final ThreadLocal<String> CURRENT = new ThreadLocal<>();

    private RequestIdContext() { }

    public static void set(String requestId) { CURRENT.set(requestId); }
    public static String current() { return CURRENT.get(); }
    public static void clear() { CURRENT.remove(); }
}
