package com.canvasearth.exception;

public class ObjectNotFoundException extends RuntimeException {
    public ObjectNotFoundException(Long id) {
        super("Object not found with id: " + id);
    }

    public ObjectNotFoundException(String message) {
        super(message);
    }
}
