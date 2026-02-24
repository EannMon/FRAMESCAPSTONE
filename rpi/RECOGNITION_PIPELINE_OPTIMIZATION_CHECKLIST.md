# Facial Recognition Pipeline Optimization Checklist (FRAMES)

## Immediate Actions
- [ ] Profile per-frame processing time (log each step)
- [ ] Move embedding/model loads outside main loop
- [ ] Implement periodic embedding cache refresh (every 30 min)
- [ ] Use numpy/KD-tree for batch comparisons
- [ ] Implement frame skipping (process every Nth frame)
- [ ] Reduce image resolution and detection size for RPi
- [ ] Add memory usage and cache size logging
- [ ] Ensure no DB calls or embedding reloads per frame
- [ ] Test on laptop and RPi, measure frame time and memory usage

## Reference Rules
- ENGINEERING_STANDARDS_FRAMES.md
- FRAMES_DEPLOYMENT_CONSTRAINTS.md
- FRAMES_OBSERVABILITY_RULES.md

---

**All items above are mandatory for FRAMES deployment.**
