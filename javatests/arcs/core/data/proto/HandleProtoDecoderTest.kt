package arcs.core.data.proto

import arcs.core.data.Capabilities
import arcs.core.data.Recipe.Handle
import arcs.core.data.TypeVariable
import arcs.core.testutil.assertThrows
import arcs.core.testutil.fail
import arcs.repoutils.runfilesDir
import com.google.common.truth.Truth.assertThat
import com.google.protobuf.Message.Builder
import com.google.protobuf.Message
import com.google.protobuf.TextFormat
import java.io.File
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4

/** Parses a given proto text as [HandleProto]. */
fun parseHandleProtoText(protoText: String): HandleProto {
    val builder = HandleProto.newBuilder()
    TextFormat.getParser().merge(protoText, builder)
    return builder.build()
}

@RunWith(JUnit4::class)
class HandleProtoDecoderTest {
    @Test
    fun decodesHandleProtoFate() {
        assertThat(HandleProto.Fate.CREATE.decode()).isEqualTo(Handle.Fate.CREATE)
        assertThat(HandleProto.Fate.USE.decode()).isEqualTo(Handle.Fate.USE)
        assertThat(HandleProto.Fate.MAP.decode()).isEqualTo(Handle.Fate.MAP)
        assertThat(HandleProto.Fate.COPY.decode()).isEqualTo(Handle.Fate.COPY)
        assertThat(HandleProto.Fate.JOIN.decode()).isEqualTo(Handle.Fate.JOIN)
        assertThrows(IllegalArgumentException::class) {
            HandleProto.Fate.UNRECOGNIZED.decode()
        }
    }

    @Test
    fun decodesCapabilitiesList() {
        assertThat(
            listOf(HandleProto.Capability.TIED_TO_ARC).decode()
        ).isEqualTo(Capabilities.TiedToArc)
        assertThat(
            listOf(HandleProto.Capability.TIED_TO_RUNTIME).decode()
        ).isEqualTo(Capabilities.TiedToRuntime)
        assertThat(
            listOf(HandleProto.Capability.PERSISTENT).decode()
        ).isEqualTo(Capabilities.Persistent)
        assertThat(
            listOf(HandleProto.Capability.QUERYABLE).decode()
        ).isEqualTo(Capabilities.Queryable)
        assertThat(
            listOf(
                HandleProto.Capability.QUERYABLE,
                HandleProto.Capability.PERSISTENT
            ).decode()
        ).isEqualTo(Capabilities.PersistentQueryable)

        assertThrows(IllegalArgumentException::class) {
            listOf(HandleProto.Capability.UNRECOGNIZED).decode()
        }
    }

    @Test
    fun decodesHandleProtoWithNoType() {
        val storageKey = "ramdisk://a"
        val handleText = buildHandleProtoText(
            "notype_thing", "CREATE", "", storageKey, "handle_c", listOf("TIED_TO_ARC")
        )
        val handleProto = parseHandleProtoText(handleText)
        with(handleProto.decode()) {
            assertThat(name).isEqualTo("notype_thing")
            assertThat(fate).isEqualTo(Handle.Fate.CREATE)
            assertThat(storageKey).isEqualTo("ramdisk://a")
            assertThat(associatedHandles).containsExactly("handle1", "handle_c")
            assertThat(type).isEqualTo(TypeVariable("notype_thing"))
            assertThat(capabilities).isEqualTo(Capabilities.TiedToArc)
        }
    }

    @Test
    fun decodesHandleProtoWithType() {
        val entityTypeProto =
            """
              entity {
                schema {
                  names: "Thing"
                  fields {
                    key: "name"
                    value: { primitive: TEXT }
                  }
                }
              }
            """.trimIndent()
        val storageKey = "ramdisk://b"
        val entityType = parseTypeProtoText(entityTypeProto).decode()
        val handleText = buildHandleProtoText(
            "thing",
            "JOIN",
            "type { ${entityTypeProto} }",
            storageKey,
            "handle_join",
            listOf("PERSISTENT", "QUERYABLE")
        )
        val handleProto = parseHandleProtoText(handleText)
        with(handleProto.decode()) {
            assertThat(name).isEqualTo("thing")
            assertThat(fate).isEqualTo(Handle.Fate.JOIN)
            assertThat(storageKey).isEqualTo("ramdisk://b")
            assertThat(associatedHandles).isEqualTo(listOf("handle1", "handle_join"))
            assertThat(type).isEqualTo(entityType)
            assertThat(capabilities).isEqualTo(Capabilities.PersistentQueryable)
        }
    }

    /** A helper function to build a handle proto in text format. */
    fun buildHandleProtoText(
        name: String,
        fate: String,
        type: String,
        storageKey: String,
        associatedHandle: String,
        capabilities: List<String>
    ) =
        """
          name: "${name}"
          fate: ${fate}
          storage_key: "$storageKey"
          associated_handles: "handle1"
          associated_handles: "${associatedHandle}"
          ${type}
          ${capabilities.joinToString { "capabilities: $it" }}
        """.trimIndent()
}
