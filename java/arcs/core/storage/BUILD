load(
    "//third_party/java/arcs/build_defs:build_defs.bzl",
    "arcs_kt_library",
)

licenses(["notice"])

package(default_visibility = ["//visibility:public"])

PROXY_SRCS = [
    "ProxyInterface.kt",
]

STORAGE_KEY_SRCS = [
    "StorageKey.kt",
    "StorageKeyParser.kt",
]

REFERENCE_SRCS = [
    "Reference.kt",
]

arcs_kt_library(
    name = "storage",
    srcs = glob(
        ["*.kt"],
        exclude = PROXY_SRCS + STORAGE_KEY_SRCS + REFERENCE_SRCS,
    ),
    exports = [
        ":proxy",
        ":reference",
        ":storage_key",
    ],
    deps = [
        ":proxy",
        ":reference",
        ":storage_key",
        "//java/arcs/core/common",
        "//java/arcs/core/crdt",
        "//java/arcs/core/data",
        "//java/arcs/core/data:rawentity",  # buildcleaner: keep
        "//java/arcs/core/storage/referencemode",
        "//java/arcs/core/storage/util",
        "//java/arcs/core/type",
        "//java/arcs/core/util",
        "//third_party/java/androidx/annotation",
        "//third_party/kotlin/kotlinx_atomicfu",
        "//third_party/kotlin/kotlinx_coroutines",
    ],
)

arcs_kt_library(
    name = "storage_key",
    srcs = STORAGE_KEY_SRCS,
)

arcs_kt_library(
    name = "reference",
    srcs = REFERENCE_SRCS,
    deps = [
        ":storage_key",
        "//java/arcs/core/common",
        "//java/arcs/core/crdt",
        "//java/arcs/core/data",
        "//third_party/kotlin/kotlinx_coroutines",
    ],
)

arcs_kt_library(
    name = "proxy",
    srcs = PROXY_SRCS,
    deps = [
        ":storage_key",
        "//java/arcs/core/crdt",
    ],
)
