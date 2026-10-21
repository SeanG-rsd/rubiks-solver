#include "NativeCubeSolver.h"

#include <ReactCommon/CxxTurboModuleUtils.h>

#include <exception>
#include <optional>
#include <thread>

#include "../cpp/rubiks-algorithm/CubeState.h"
#include "../cpp/rubiks-algorithm/KociembaSolver.h"

namespace facebook::react {

namespace {

// the tables take about 12 MB and a moment to build, so there's one solver shared by every
// instance of the module (a new one is made for each JS runtime, e.g. after a reload)
const KociembaSolver& Solver() {
  static const KociembaSolver solver;
  return solver;
}

// adds the module to React Native as soon as the app's native code is loaded, so neither the
// iOS nor the Android app code has to know about it
[[maybe_unused]] const bool registered = [] {
  registerCxxModuleToGlobalModuleMap(
      std::string(NativeCubeSolver::kModuleName),
      [](std::shared_ptr<CallInvoker> jsInvoker) {
        return std::make_shared<NativeCubeSolver>(std::move(jsInvoker));
      });
  return true;
}();

} // namespace

NativeCubeSolver::NativeCubeSolver(std::shared_ptr<CallInvoker> jsInvoker)
    : NativeCubeSolverCxxSpec(std::move(jsInvoker)) {
  // start on the tables now, they'll likely be ready by the time a cube has been scanned
  std::thread([] { Solver(); }).detach();
}

AsyncPromise<std::string> NativeCubeSolver::solve(jsi::Runtime& rt, std::string facelets) {
  AsyncPromise<std::string> promise(rt, jsInvoker_);

  // solving can take a few seconds, so it's done off the JS thread. the promise is settled back
  // on the JS thread, since settling it releases JS functions
  std::thread([promise, facelets = std::move(facelets), jsInvoker = jsInvoker_]() mutable {
    std::string solution;
    std::optional<std::string> error;

    try {
      solution = Solver().Solve(CubeState(facelets.c_str()));
    } catch (const std::exception& e) {
      error = e.what();
    }

    jsInvoker->invokeAsync(
        [promise = std::move(promise), solution = std::move(solution), error = std::move(error)](jsi::Runtime&) mutable {
          if (error) {
            promise.reject(Error(std::move(*error)));
          } else {
            promise.resolve(std::move(solution));
          }
        });
  }).detach();

  return promise;
}

} // namespace facebook::react
