package com.machinerylog.ocr;

import java.io.InputStream;

public interface OcrClient {
    OcrResult process(InputStream image, String contentType, long size);
}