load(
    "//tools/build_defs/android:rules.bzl",
    "android_instrumentation_test", "android_binary",
)
load(
    "//tools/build_defs/kotlin:rules.bzl", "kt_android_library"
)

licenses(["notice"])

package(default_visibility = ["//visibility:public"])

android_instrumentation_test(
    name = "storage_service_e2e",
    target_device = "//tools/android/emulated_devices/generic_phone:android_28_x86",
    test_app = ":test_app",
)

android_binary(
    name = "test_app",
    manifest = "AndroidTestManifest.xml",
    deps = [":tests"],
)

kt_android_library(
    name = "tests"
)

android_binary(
    name = "app_under_test",
    manifest = "AndroidInstrumentedManifest.xml",
    deps = [":lib_under_test"],
)

kt_android_library(
    name = ":lib_under_test",
)

