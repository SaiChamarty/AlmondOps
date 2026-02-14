# AlmondOps Playbooks

This folder contains the structured hazard logic used by AlmondOps to generate 72-hour risk reports for California almond growers.

Each playbook defines:
- Growth stage sensitivity (Dormant, Bloom, Petal Fall, Nut Fill, Hull Split)
- Weather trigger thresholds (temperature, rainfall, humidity, wind)
- A 2-hour sustained exposure rule
- Clear Before / During / After action steps

The goal is fast, stage-aware operational decision support — not chemical prescription.

---

## Scientific Sources

Thresholds and stage logic are based on:

- **UC Integrated Pest Management (UC IPM)**  
  Frost sensitivity by stage, blossom disease timing, rain-triggered infection risk.

- **UC Division of Agriculture and Natural Resources (UC ANR)**  
  Heat stress impacts during Nut Fill and irrigation-based mitigation.

- **Sacramento Valley Orchards (UC Cooperative Extension)**  
  Bee activity standards (“Bee Hour”: >55°F, <15 mph wind, no rain) and pollination disruption.

- **The Almond Board of California**  
  Lifecycle timing and irrigation efficiency guidance.

---

## Key Thresholds Used

- **Frost:** 27–28°F during Bloom may cause major crop loss; duration matters.
- **Heat:** 95°F stress, 100°F damage risk, 105°F severe tissue damage.
- **Rain/Wind:** Pollination disrupted by rain or wind >15–25 mph during Bloom.
- **Disease:** 55–75°F + high humidity + rain during Bloom increases infection risk.

---

California only.  
72-hour forecast window.  
Research-based, simplified for real-time risk detection.
