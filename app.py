# app.py -------------------------------------------------------
import streamlit as st
from ultralytics import YOLO
from rf_detr_loader import load_rfdetr, infer_rfdetr
from PIL import Image
import torch
import torch.nn as nn
import cv2
import tempfile
import numpy as np
import time


# ============================================================
# PATCH YOLO12
# ============================================================
def patch_aattn_qkv(model):
    count = 0
    for m in model.model.modules():
        if m.__class__.__name__ == "AAttn" and not hasattr(m, "qkv"):
            c = None
            if hasattr(m.qk, "conv"):
                c = m.qk.conv.weight.shape[1]
            elif hasattr(m.qk, "weight"):
                c = m.qk.weight.shape[1]

            if c is None:
                continue

            m.qkv = nn.Conv2d(c, c * 3, 1, bias=False)
            count += 1

    print(f"[PATCH] Added qkv to {count} AAttn blocks")


# ============================================================
# LOAD MODELS (CACHED)
# ============================================================
device = "cuda" if torch.cuda.is_available() else "cpu"


@st.cache_resource
def load_yolo11():
    return YOLO("yolo11_best.pt")


@st.cache_resource
def load_yolo12():
    m = YOLO("yolo12_best.pt")
    patch_aattn_qkv(m)
    return m


@st.cache_resource
def load_rfdetr_model():
    m = load_rfdetr("checkpoint_best_total.pth")
    try:
        m.to(device)
    except:
        pass
    return m


model_yolo11 = load_yolo11()
model_yolo12 = load_yolo12()
model_rfdetr = load_rfdetr_model()

models = {
    "YOLO11": model_yolo11,
    "YOLO12": model_yolo12,
    "RF-DETR": model_rfdetr,
}


# ============================================================
# STREAMLIT UI
# ============================================================
st.title("🔍 CS406 Multi Detection App")
st.write("So sánh YOLO11 / YOLO12 / RF-DETR")

conf = st.slider("Confidence", 0.1, 1.0, 0.5, key="conf_global")


# ============================================================
# IMAGE DETECTION
# ============================================================
st.header("🖼 Image Detection")

selected_image_model = st.selectbox("Model dùng cho ảnh:", list(models.keys()))

upload_img = st.file_uploader("Upload image:", type=["jpg", "jpeg", "png"])

if upload_img:
    img = Image.open(upload_img).convert("RGB")
    st.image(img, caption="Ảnh gốc", width=500)

    if st.button("🚀 RUN DETECTION (Image)"):
        if selected_image_model in ["YOLO11", "YOLO12"]:
            result = models[selected_image_model].predict(img, conf=conf)[0]
            out = cv2.cvtColor(result.plot(font_size=0.4)
, cv2.COLOR_BGR2RGB)
            st.image(out)
        else:
            out, _ = infer_rfdetr(model_rfdetr, img, conf)
            st.image(out)

    if st.button("🆚 Compare all models"):
        c1, c2, c3 = st.columns(3)

        with c1:
            r = model_yolo11.predict(img, conf=conf)[0]
            st.image(cv2.cvtColor(r.plot(), cv2.COLOR_BGR2RGB), caption="YOLO11")

        with c2:
            r = model_yolo12.predict(img, conf=conf)[0]
            st.image(cv2.cvtColor(r.plot(), cv2.COLOR_BGR2RGB), caption="YOLO12")

        with c3:
            out, _ = infer_rfdetr(model_rfdetr, img, conf)
            st.image(out, caption="RF-DETR")


# ============================================================
# REALTIME VIDEO DETECTION (ONLY UPLOADED VIDEO)
# ============================================================
st.header("🎥 Real-time Video Detection (Upload only)")

# Session state
if "video_path" not in st.session_state:
    st.session_state.video_path = None
if "run_video" not in st.session_state:
    st.session_state.run_video = False

selected_video_model = st.selectbox("Model dùng cho video:", list(models.keys()))


# ============================================================
# Upload video (NO WEBCAM)
# ============================================================
uploaded_video = st.file_uploader("Upload video:", type=["mp4", "avi", "mov"])

if uploaded_video is not None:
    if st.session_state.video_path is None:
        t = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
        t.write(uploaded_video.read())
        st.session_state.video_path = t.name

    st.success("📁 Video uploaded → sẵn sàng chạy!")
    st.session_state.run_video = True


# Start / Stop
col1, col2 = st.columns(2)
if col1.button("▶ Start Video"):
    st.session_state.run_video = True

if col2.button("⏹ Stop Video"):
    st.session_state.run_video = False


frame_box = st.empty()


# ============================================================
# REALTIME LOOP (NO RERUN)
# ============================================================
if st.session_state.run_video:

    cap = cv2.VideoCapture(st.session_state.video_path)

    if not cap.isOpened():
        st.error("Không mở được video!")
        st.stop()

    # Loop
    while st.session_state.run_video:
        ret, frame = cap.read()
        if not ret:
            st.warning("Video ended.")
            break

        if selected_video_model in ["YOLO11", "YOLO12"]:
            result = models[selected_video_model].predict(frame, conf=conf)[0]
            out = result.plot(font_size=0.4)

        else:
            out, _ = infer_rfdetr(model_rfdetr, Image.fromarray(frame), conf)

        out_rgb = cv2.cvtColor(out, cv2.COLOR_BGR2RGB)
        frame_box.image(out_rgb, channels="RGB")

        cv2.waitKey(1)

    cap.release()
