package com.dramatv.community.publish.persistence;

public enum PublishDraftType {
    VIDEO("video"),
    WORKFLOW("workflow"),
    POST("post");

    private final String code;

    PublishDraftType(String code) {
        this.code = code;
    }

    public String code() {
        return code;
    }
}
