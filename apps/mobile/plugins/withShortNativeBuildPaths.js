// Moves every library's CMake build folder (.cxx) out of node_modules into apps/mobile/.cxx.
//
// pnpm's paths (node_modules/.pnpm/<name>@<version>_<hash>/node_modules/<name>/android/.cxx/…)
// push CMake's compiler-check folders past 260 characters, and Windows cannot run a process
// in a working directory that long even with long paths enabled — the Android release build
// fails in react-native-reanimated's configure step ("lld: error: unknown argument: -z").
// Outside android/, the native build cache also survives `expo prebuild --clean`.
const { withProjectBuildGradle } = require('expo/config-plugins')

const MARKER = '// withShortNativeBuildPaths'
// The block must come before this line: the plugin it applies evaluates :app straight away,
// and AGP refuses buildStagingDirectory once a project's native build has been configured.
const ANCHOR = 'apply plugin: "expo-root-project"'

const BLOCK = `${MARKER}
subprojects { sub ->
  sub.plugins.withId('com.android.library') {
    sub.android.externalNativeBuild.cmake.buildStagingDirectory =
      new File(rootProject.projectDir, "../.cxx/\${sub.name}")
  }
}

`

module.exports = function withShortNativeBuildPaths(config) {
  return withProjectBuildGradle(config, (mod) => {
    const { contents, language } = mod.modResults
    if (language !== 'groovy' || contents.includes(MARKER)) return mod
    if (!contents.includes(ANCHOR)) {
      throw new Error(`withShortNativeBuildPaths: '${ANCHOR}' not found in android/build.gradle`)
    }
    mod.modResults.contents = contents.replace(ANCHOR, BLOCK + ANCHOR)
    return mod
  })
}
