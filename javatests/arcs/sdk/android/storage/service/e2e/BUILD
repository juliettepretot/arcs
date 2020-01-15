load(
    "//tools/build_defs/android:rules.bzl",
    "android_binary",
    "android_instrumentation_test",
)
load(
    "//tools/build_defs/kotlin:rules.bzl",
    "kt_android_library",
)

licenses(["notice"])

package(default_visibility = ["//visibility:public"])

android_instrumentation_test(
    name = "storage_service_e2e",
    target_device = "//tools/android/emulated_devices/generic_phone:android_28_x86",
    test_app = ":test_app",
)

# Host of the actual tests.
android_binary(
    name = "test_app",
    custom_package = "arcs.android.storage.service.e2e_test",
    instruments = ":app_under_test",
    manifest = "AndroidManifest_Test.xml",
    deps = [":tests"],
)

# Actual tests.
TEST_SRCS = glob(["*Test.kt"])

kt_android_library(
    name = "tests",
    testonly = True,
    srcs = TEST_SRCS,
    deps = [
        ":lib_under_test",
        "//java/arcs/android/crdt",
        "//java/arcs/android/storage",
        "//java/arcs/android/storage/service:aidl",
        "//java/arcs/core/crdt",
        "//java/arcs/core/data",
        "//java/arcs/core/storage",
        "//java/arcs/core/storage/driver",
        "//java/arcs/sdk/android/storage",
        "//java/arcs/sdk/android/storage/service",
        "//third_party/android/androidx_test/core",
        "//third_party/android/androidx_test/ext/junit",
        "//third_party/android/androidx_test/runner",
        "//third_party/android/androidx_test/runner/rules",
        "//third_party/java/androidx/lifecycle",
        "//third_party/java/junit:junit-android",
        "//third_party/java/truth:truth-android",
        "//third_party/kotlin/kotlinx_coroutines",
    ],
)

# Host of the storage service, and client service.
android_binary(
    name = "app_under_test",
    manifest = "AndroidManifest.xml",
    deps = [
        ":lib_under_test",
    ],
)

kt_android_library(
    name = "lib_under_test",
    testonly = True,
    srcs = glob(
        ["*.kt"],
        exclude = TEST_SRCS,
    ),
    manifest = "AndroidManifest.xml",
    deps = [
        "//java/arcs/core/storage:storage_key",
        "//java/arcs/sdk/android/storage",
        "//java/arcs/sdk/android/storage/service",
    ],
)
