package vn.edu.iuh.fit.enums;

public enum ReactType {
    LIKE("LIKE"),
    LOVE("LOVE"),
    HAHA("HAHA"),
    WOW("WOW"),
    SAD("SAD"),
    ANGRY("ANGRY");

    private final String value;

    ReactType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static ReactType fromValue(String value) {
        for (ReactType type : ReactType.values()) {
            if (type.getValue().equalsIgnoreCase(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown reaction type: " + value);
    }
}
