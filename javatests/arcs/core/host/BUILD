load(
    "//third_party/java/arcs/build_defs:build_defs.bzl",
    "arcs_kt_jvm_library",
    "arcs_kt_jvm_test_suite",
)

licenses(["notice"])

package(default_visibility = ["//visibility:public"])

arcs_kt_jvm_test_suite(
    name = "host",
    srcs = glob(["*Test.kt"]),
    package = "arcs.core.host",
    deps = [
        ":particle",
        "//java/arcs/core/host",
        "//java/arcs/core/sdk",
        "//java/arcs/jvm/host",
        "//third_party/java/auto:auto_service",
        "//third_party/java/junit:junit-android",
        "//third_party/java/truth:truth-android",
    ],
)

arcs_kt_jvm_library(
    name = "particle",
    srcs = glob(
        ["*.kt"],
        exclude = ["*Test.kt"],
    ),
    deps = [
        "//java/arcs/core/host",
        "//java/arcs/core/sdk",
        "//third_party/java/auto:auto_service",
    ],
)