package com.canvasearth.exception;

public class FileSizeExceededException extends RuntimeException {
    public FileSizeExceededException(String message) {
        super(message);
    }

    public FileSizeExceededException(long fileSize, long maxSize) {
        super(String.format("File size %d bytes exceeds maximum allowed size of %d bytes",
            fileSize, maxSize));
    }
}
