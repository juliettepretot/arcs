/*
 * Copyright 2020 Google LLC.
 *
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 *
 * Code distributed by Google as part of this project is also subject to an additional IP rights
 * grant found at
 * http://polymer.github.io/PATENTS.txt
 */

package arcs.android.demo

import android.os.Bundle
import android.widget.Button
import androidx.appcompat.app.AppCompatActivity
import arcs.android.host.AndroidManifestHostRegistry
import arcs.core.allocator.Allocator
import arcs.core.host.EntityHandleManager
import arcs.core.host.HostRegistry
import arcs.core.util.Scheduler
import arcs.jvm.util.JvmTime
import arcs.sdk.android.storage.ServiceStoreFactory
import java.util.concurrent.Executors
import kotlin.coroutines.CoroutineContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.Job
import kotlinx.coroutines.asCoroutineDispatcher
import kotlinx.coroutines.launch

/** Entry UI to launch Arcs demo. */
@OptIn(ExperimentalCoroutinesApi::class)
class DemoActivity : AppCompatActivity() {

    private val coroutineContext: CoroutineContext = Job() + Dispatchers.Main
    private val scope: CoroutineScope = CoroutineScope(coroutineContext)

    /**
     * Recipe hand translated from 'person.arcs'
     */
    private lateinit var allocator: Allocator
    private lateinit var hostRegistry: HostRegistry

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContentView(R.layout.main_activity)

        scope.launch {
            hostRegistry = AndroidManifestHostRegistry.create(this@DemoActivity)
            allocator = Allocator.create(
                hostRegistry,
                EntityHandleManager(
                    time = JvmTime,
                    scheduler = Scheduler(
                        JvmTime,
                        coroutineContext +
                            Executors.newSingleThreadExecutor().asCoroutineDispatcher()
                    ),
                    activationFactory = ServiceStoreFactory(
                        context = this@DemoActivity,
                        lifecycle = this@DemoActivity.getLifecycle()
                    )
                )
            )

            findViewById<Button>(R.id.person_test).setOnClickListener {
                testPersonRecipe()
            }
        }
    }

    private fun testPersonRecipe() {
        scope.launch {
            val arcId = allocator.startArcForPlan("Person", PersonRecipePlan)
            allocator.stopArc(arcId)
        }
    }
}
