from __future__ import annotations

import argparse
from pathlib import Path

import tensorrt as trt

ONNX_PATH = Path("backend/models/rfdetr_medium.onnx")
ENGINE_PATH = Path("backend/models/rfdetr_medium_fp32.engine")


def build_rfdetr_tensorrt_engine(
    onnx_path: Path = ONNX_PATH,
    engine_path: Path = ENGINE_PATH,
    workspace_gib: int = 4,
    fp16: bool = False,
) -> Path:
    if not onnx_path.exists():
        raise FileNotFoundError(onnx_path)

    logger = trt.Logger(trt.Logger.INFO)
    builder = trt.Builder(logger)
    network_flags = 1 << int(trt.NetworkDefinitionCreationFlag.EXPLICIT_BATCH)
    network = builder.create_network(network_flags)
    parser = trt.OnnxParser(network, logger)

    if not parser.parse(onnx_path.read_bytes()):
        errors = [str(parser.get_error(index)) for index in range(parser.num_errors)]
        raise RuntimeError("TensorRT ONNX parse failed:\n" + "\n".join(errors))

    config = builder.create_builder_config()
    config.set_memory_pool_limit(trt.MemoryPoolType.WORKSPACE, workspace_gib * (1 << 30))
    if fp16 and builder.platform_has_fast_fp16:
        config.set_flag(trt.BuilderFlag.FP16)

    serialized_engine = builder.build_serialized_network(network, config)
    if serialized_engine is None:
        raise RuntimeError("TensorRT engine build failed")

    engine_path.parent.mkdir(parents=True, exist_ok=True)
    engine_path.write_bytes(serialized_engine)
    return engine_path


def main() -> None:
    parser = argparse.ArgumentParser(description="Build an RF-DETR TensorRT engine.")
    parser.add_argument("--onnx", type=Path, default=ONNX_PATH)
    parser.add_argument("--engine", type=Path, default=ENGINE_PATH)
    parser.add_argument("--workspace-gib", type=int, default=4)
    parser.add_argument("--fp16", action="store_true")
    args = parser.parse_args()

    engine_path = build_rfdetr_tensorrt_engine(
        onnx_path=args.onnx,
        engine_path=args.engine,
        workspace_gib=args.workspace_gib,
        fp16=args.fp16,
    )
    print(f"RF-DETR TensorRT engine built at {engine_path}")


if __name__ == "__main__":
    main()
