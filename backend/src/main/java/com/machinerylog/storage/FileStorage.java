package com.machinerylog.storage;

import java.io.InputStream;

public interface FileStorage {
    String store(String objectName, InputStream content, long size, String contentType);
}