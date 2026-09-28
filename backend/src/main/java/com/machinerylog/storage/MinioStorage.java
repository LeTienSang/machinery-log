package com.machinerylog.storage;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.http.Method;
import java.io.InputStream;
import java.util.concurrent.TimeUnit;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class MinioStorage implements FileStorage {
    private final MinioClient client;
    private final String bucket;

    public MinioStorage(
        @Value("${machinery-log.storage.endpoint:http://localhost:9000}") String endpoint,
        @Value("${machinery-log.storage.access-key:machinery-log}") String accessKey,
        @Value("${machinery-log.storage.secret-key:machinery-log-local}") String secretKey,
        @Value("${machinery-log.storage.bucket:machinery-log-images}") String bucket
    ) {
        this.client = MinioClient.builder().endpoint(endpoint).credentials(accessKey, secretKey).build();
        this.bucket = bucket;
    }

    @Override
    public String store(String objectName, InputStream content, long size, String contentType) {
        try {
            if (!client.bucketExists(BucketExistsArgs.builder().bucket(bucket).build())) {
                client.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
            }
            client.putObject(PutObjectArgs.builder().bucket(bucket).object(objectName)
                .stream(content, size, -1).contentType(contentType).build());
            return client.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
                .method(Method.GET).bucket(bucket).object(objectName).expiry(7, TimeUnit.DAYS).build());
        } catch (Exception exception) {
            throw new StorageException("Unable to store original image", exception);
        }
    }
}