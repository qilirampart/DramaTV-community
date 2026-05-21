package com.dramatv.community.interaction.moderation;

import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "dramatv.comment-moderation")
public class CommentModerationProperties {

    private boolean enabled = true;
    private int maxLength = 500;
    private int burstWindowSeconds = 60;
    private int burstMaxComments = 6;
    private int duplicateWindowMinutes = 10;
    private int duplicateMaxCopies = 1;
    private List<String> blockedKeywords = new ArrayList<>(List.of(
            "法轮功",
            "台独",
            "港独",
            "藏独",
            "疆独",
            "颠覆国家政权",
            "推翻政府",
            "六四屠杀",
            "天安门屠杀",
            "成人视频",
            "色情视频",
            "裸聊",
            "援交",
            "约炮",
            "嫖娼",
            "迷奸",
            "乱伦",
            "幼交",
            "幼女",
            "未成年性行为",
            "上门服务",
            "操你妈",
            "草你妈",
            "艹你妈",
            "曹你妈",
            "妈的",
            "他妈的",
            "傻逼",
            "煞笔",
            "沙比",
            "sb",
            "cnm",
            "nmsl",
            "滚你妈",
            "死全家",
            "你妈死了"
    ));
    private List<String> hiddenSpamKeywords = new ArrayList<>(List.of(
            "加微信",
            "加v",
            "私聊",
            "私信我",
            "资源群",
            "加群",
            "接单",
            "代发",
            "兼职",
            "刷单",
            "返利",
            "推广",
            "引流",
            "开户"
    ));

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public int getMaxLength() {
        return maxLength;
    }

    public void setMaxLength(int maxLength) {
        this.maxLength = maxLength;
    }

    public int getBurstWindowSeconds() {
        return burstWindowSeconds;
    }

    public void setBurstWindowSeconds(int burstWindowSeconds) {
        this.burstWindowSeconds = burstWindowSeconds;
    }

    public int getBurstMaxComments() {
        return burstMaxComments;
    }

    public void setBurstMaxComments(int burstMaxComments) {
        this.burstMaxComments = burstMaxComments;
    }

    public int getDuplicateWindowMinutes() {
        return duplicateWindowMinutes;
    }

    public void setDuplicateWindowMinutes(int duplicateWindowMinutes) {
        this.duplicateWindowMinutes = duplicateWindowMinutes;
    }

    public int getDuplicateMaxCopies() {
        return duplicateMaxCopies;
    }

    public void setDuplicateMaxCopies(int duplicateMaxCopies) {
        this.duplicateMaxCopies = duplicateMaxCopies;
    }

    public List<String> getBlockedKeywords() {
        return blockedKeywords;
    }

    public void setBlockedKeywords(List<String> blockedKeywords) {
        this.blockedKeywords = blockedKeywords == null ? new ArrayList<>() : new ArrayList<>(blockedKeywords);
    }

    public List<String> getHiddenSpamKeywords() {
        return hiddenSpamKeywords;
    }

    public void setHiddenSpamKeywords(List<String> hiddenSpamKeywords) {
        this.hiddenSpamKeywords = hiddenSpamKeywords == null ? new ArrayList<>() : new ArrayList<>(hiddenSpamKeywords);
    }
}
