#pragma once

#include <AppSpecsJSI.h>

#include <memory>
#include <string>

namespace facebook::react {

class NativeCubeSolver : public NativeCubeSolverCxxSpec<NativeCubeSolver> {
public:
  NativeCubeSolver(std::shared_ptr<CallInvoker> jsInvoker);

  AsyncPromise<std::string> solve(jsi::Runtime& rt, std::string facelets);
};

} // namespace facebook::react
