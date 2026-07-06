package life.ispassingme.by

import android.media.AudioAttributes
import android.media.MediaPlayer
import io.flutter.FlutterInjector
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.io.File

class MainActivity : FlutterActivity() {
    private val channelName = "life.ispassingme.by/sound"
    private var player: MediaPlayer? = null

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, channelName)
            .setMethodCallHandler { call, result ->
                when (call.method) {
                    "playOneUp" -> {
                        playOneUp()
                        result.success(null)
                    }
                    else -> result.notImplemented()
                }
            }
    }

    // Plays the bundled 1-up chime. The asset is copied to the cache dir once
    // (so it works regardless of APK compression), then played via MediaPlayer.
    private fun playOneUp() {
        try {
            val assetKey = FlutterInjector.instance().flutterLoader()
                .getLookupKeyForAsset("assets/audio/oneup_mushroom.mp3")
            val outFile = File(cacheDir, "oneup_mushroom.mp3")
            if (!outFile.exists() || outFile.length() == 0L) {
                assets.open(assetKey).use { input ->
                    outFile.outputStream().use { output -> input.copyTo(output) }
                }
            }

            player?.release()
            player = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                )
                setDataSource(outFile.absolutePath)
                setOnCompletionListener { mp ->
                    mp.release()
                    if (player === mp) player = null
                }
                prepare()
                start()
            }
        } catch (e: Exception) {
            // Sound is non-critical — never crash the app over playback.
        }
    }

    override fun onDestroy() {
        player?.release()
        player = null
        super.onDestroy()
    }
}
