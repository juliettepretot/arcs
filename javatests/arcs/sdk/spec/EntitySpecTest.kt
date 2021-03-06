package arcs.sdk.spec

import arcs.core.common.Id
import arcs.core.data.RawEntity
import arcs.core.data.RawEntity.Companion.NO_REFERENCE_ID
import arcs.core.data.Ttl
import arcs.core.data.util.toReferencable
import arcs.core.entity.SchemaRegistry
import arcs.jvm.util.testutil.FakeTime
import arcs.sdk.Reference
import com.google.common.truth.Truth.assertThat
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runBlockingTest
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4

private typealias Foo = EntitySpecParticle_Foo
private typealias Bar = EntitySpecParticle_Bars

/** Specification tests for entities. */
@ExperimentalCoroutinesApi
@RunWith(JUnit4::class)
class EntitySpecTest {

    class EntitySpecParticle : AbstractEntitySpecParticle()

    private lateinit var idGenerator: Id.Generator
    private var currentTime: Long = 500L

    @get:Rule
    val harness = EntitySpecParticleTestHarness { EntitySpecParticle() }

    @Before
    fun setUp() = runBlockingTest {
        idGenerator = Id.Generator.newForTest("session")
        harness.start()
    }

    @Test
    fun createEmptyInstance() {
        val entity = Foo()
        assertThat(entity.bool).isFalse()
        assertThat(entity.num).isEqualTo(0.0)
        assertThat(entity.text).isEqualTo("")
        assertThat(entity.ref).isNull()
        assertThat(entity.bools).isEmpty()
        assertThat(entity.nums).isEmpty()
        assertThat(entity.texts).isEmpty()
        assertThat(entity.refs).isEmpty()
    }

    @Test
    fun createWithFieldValues() = runBlockingTest {
        val ref1 = createBarReference(Bar(value = "bar1"))
        val ref2 = createBarReference(Bar(value = "bar2"))
        val ref3 = createBarReference(Bar(value = "bar3"))
        val entity = Foo(
            bool = true,
            num = 123.0,
            text = "abc",
            ref = ref1,
            bools = setOf(false),
            nums = setOf(456.0, 789.0),
            texts = setOf("def", "ghi"),
            refs = setOf(ref2, ref3)
        )
        assertThat(entity.bool).isEqualTo(true)
        assertThat(entity.num).isEqualTo(123.0)
        assertThat(entity.text).isEqualTo("abc")
        assertThat(entity.ref).isEqualTo(ref1)
        assertThat(entity.bools).containsExactly(false)
        assertThat(entity.nums).containsExactly(456.0, 789.0)
        assertThat(entity.texts).containsExactly("def", "ghi")
        assertThat(entity.refs).containsExactly(ref2, ref3)
    }

    @Test
    fun ensureEntityFields() {
        val entity = Foo()
        assertThat(entity.entityId).isNull()

        entity.ensureEntityFields(idGenerator, "handle", FakeTime(currentTime))
        val entityId = entity.entityId

        // Check that the entity ID has been set to *something*.
        assertThat(entityId).isNotNull()
        assertThat(entityId).isNotEmpty()
        assertThat(entityId).isNotEqualTo(NO_REFERENCE_ID)
        assertThat(entityId).contains("handle")

        val creationTimestamp = entity.serialize().creationTimestamp
        assertThat(creationTimestamp).isEqualTo(currentTime)

        // Calling it again doesn't overwrite id and timestamp.
        entity.ensureEntityFields(idGenerator, "something-else", FakeTime(currentTime+10))
        assertThat(entity.entityId).isEqualTo(entityId)
        assertThat(entity.serialize().creationTimestamp).isEqualTo(creationTimestamp)
    }

    @Test
    fun expiryTimestamp() {
        val entity = Foo()
        
        entity.ensureEntityFields(idGenerator, "handle", FakeTime(currentTime), Ttl.Minutes(1))
        
        val expirationTimestamp = entity.serialize().expirationTimestamp
        assertThat(expirationTimestamp).isEqualTo(currentTime + 60000) // 1 minute = 60'000 milliseconds
    }

    @Test
    fun copy() = runBlockingTest {
        val ref1 = createBarReference(Bar(value = "bar1"))
        val ref2 = createBarReference(Bar(value = "bar2"))
        val ref3 = createBarReference(Bar(value = "bar3"))
        val entity = Foo(
            bool = true,
            num = 123.0,
            text = "abc",
            ref = ref1,
            bools = setOf(false),
            nums = setOf(456.0, 789.0),
            texts = setOf("def", "ghi"),
            refs = setOf(ref2, ref3)
        )

        // Copying an unidentified entity should give an exact copy of the entity.
        assertThat(entity.copy()).isEqualTo(entity)

        // Copying an identified entity should reset the ID.
        entity.identify()
        val copy1 = entity.copy()
        assertThat(copy1.entityId).isNull()
        assertThat(copy1).isNotEqualTo(entity)

        // Copying an entity with replacement fields should overwrite those fields in the copy.
        val copy2 = entity.copy(
            bool = false,
            num = 456.0,
            text = "xyz",
            ref = ref2,
            bools = setOf(true),
            nums = setOf(111.0, 222.0),
            texts = setOf("aaa", "bbb"),
            refs = setOf(ref1, ref3)
        )
        assertThat(copy2.entityId).isNull()
        assertThat(copy2.bool).isFalse()
        assertThat(copy2.num).isEqualTo(456.0)
        assertThat(copy2.text).isEqualTo("xyz")
        assertThat(copy2.ref).isEqualTo(ref2)
        assertThat(copy2.bools).containsExactly(true)
        assertThat(copy2.nums).containsExactly(111.0, 222.0)
        assertThat(copy2.texts).containsExactly("aaa", "bbb")
        assertThat(copy2.refs).containsExactly(ref1, ref3)
    }

    @Test
    fun serialize_roundTrip() = runBlockingTest {
        val ref1 = createBarReference(Bar(value = "bar1"))
        val ref2 = createBarReference(Bar(value = "bar2"))
        val ref3 = createBarReference(Bar(value = "bar3"))
        val entity = Foo(
            bool = true,
            num = 123.0,
            text = "abc",
            ref = ref1,
            bools = setOf(false),
            nums = setOf(456.0, 789.0),
            texts = setOf("def", "ghi"),
            refs = setOf(ref2, ref3)
        )
        val entityId = entity.identify()

        val rawEntity = entity.serialize()

        assertThat(rawEntity).isEqualTo(
            RawEntity(
                entityId,
                singletons = mapOf(
                    "bool" to true.toReferencable(),
                    "num" to 123.0.toReferencable(),
                    "text" to "abc".toReferencable(),
                    "ref" to ref1.toReferencable()
                ),
                collections = mapOf(
                    "bools" to setOf(false.toReferencable()),
                    "nums" to setOf(456.0.toReferencable(), 789.0.toReferencable()),
                    "texts" to setOf("def".toReferencable(), "ghi".toReferencable()),
                    "refs" to setOf(ref2.toReferencable(), ref3.toReferencable())
                ),
                creationTimestamp = 500L
            )
        )
        assertThat(Foo.deserialize(rawEntity)).isEqualTo(entity)
    }

    @Test
    fun schemaRegistry() {
        // The entity class should have registered itself statically.
        val hash = Foo.SCHEMA.hash
        assertThat(SchemaRegistry.getEntitySpec(hash)).isEqualTo(Foo)
        assertThat(SchemaRegistry.getSchema(hash)).isEqualTo(Foo.SCHEMA)
    }

    /**
     * Stores the given [Bar] entity in a collection, and then creates and returns a reference to
     * it.
     */
    private suspend fun createBarReference(bar: Bar): Reference<Bar> {
        harness.bars.store(bar)
        return harness.bars.createReference(bar)
    }

    /** Generates and returns an ID for the entity. */
    private fun (Foo).identify(): String {
        assertThat(entityId).isNull()
        ensureEntityFields(idGenerator, "handleName", FakeTime(currentTime))
        assertThat(entityId).isNotNull()
        return entityId!!
    }
}
