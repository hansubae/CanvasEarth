package com.canvasearth.exception;

public class InvalidFileTypeException extends RuntimeException {
    public InvalidFileTypeException(String message) {
        super(message);
    }

    public InvalidFileTypeException(String fileType, String reason) {
        super(String.format("Invalid file type '%s': %s", fileType, reason));
    }
}
