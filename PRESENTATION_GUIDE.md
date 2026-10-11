# Online Car Rental System: presentation guide

Presentation: **13 Oct 2569, 09:00** (2 points). Report deadline: **12 Oct 2569, 23:59** on Onlearn (8 points).

## 1. How the deck maps to the rubric

| Rubric item (8-point report / 2-point presentation) | Slide(s) |
|---|---|
| 1) บทนำ ที่มาของปัญหา ความสำคัญ | 2, 3, 4 |
| 2) ทฤษฎีที่เกี่ยวข้อง | 8, 9, 10 (ERD, Normalization, Data Dictionary) |
| 3) การออกแบบฐานข้อมูลจากความต้องการผู้ใช้ | 4, 6, 7, 8 |
| **การเลือกใช้ซอฟต์แวร์ที่เหมาะสม** | 5 |
| **ขั้นตอนการสร้างฐานข้อมูล (SQL-DDL)** | 11 |
| **ตัวอย่างข้อมูลที่เหมาะสม** | 12 |
| **ทดสอบ SQL DDL/DML ง่าย / กลาง / ซับซ้อน, 5-10 คำสั่งต่อระดับ** | 13 (6 easy), 14 (5 medium), 15 + 16 (7 complex) |
| 5) สรุปและประเมินผล | 17 |

> **The report has gaps.** Chapters 4 (การสร้างฐานข้อมูลและการทดสอบ) and 5 (สรุป) are missing, and so is all of the SQL the rubric scores.
> `sql/car_rental.sql` fills them. Paste it into Chapter 4, together with screenshots of the results from `sql/test_results.txt`.

## 2. Workflow from start to finish

1. **Outline**: approve it in the Canva outline widget (done in chat).
2. **Generate**: Canva builds a 17-slide deck in navy, teal and amber.
3. **Insert the real diagrams** from `slide-assets/` (Canva → Uploads → drag the files in):
   - Slide 6 → `workflow-sequence.png`
   - Slide 8 → `erd.png`
   - Slide 9 → `normalization.jpeg`
   - Slide 10 → `data-dictionary.png`
4. **Paste the code blocks** (section 3 below) into slides 11 and 13-16. Use a monospace font such as *JetBrains Mono* or *Courier Prime* at 14-16 pt on a dark rounded rectangle.
5. **Add screenshots of the results.** Run `sql/car_rental.sql` in pgAdmin or the Supabase SQL editor and screenshot each result grid. Real output is stronger evidence than typed numbers.
6. **Polish**: one idea per slide, keep text under about 40 words, give each slide the same title position, and use the *Fade* or *Match & Move* transition.
7. **Rehearse** with Canva *Present → Presenter view* and aim for about 10 minutes.
8. **Back up**: export a PDF and a PPTX in case the projector has no internet. Bring the share link too.

## 3. Code to paste (copy exactly; every query has been tested on PostgreSQL 16)

**Slide 11: DDL**
```sql
CREATE TABLE booking (
  booking_id     SERIAL PRIMARY KEY,
  customer_id    INT NOT NULL REFERENCES customer(customer_id),
  car_id         INT NOT NULL REFERENCES car(car_id),
  start_date     TIMESTAMP NOT NULL,
  end_date       TIMESTAMP NOT NULL,
  deposit_amount DECIMAL(10,2) DEFAULT 0 CHECK (deposit_amount >= 0),
  status VARCHAR(20) DEFAULT 'Pending'
    CHECK (status IN ('Pending','Confirmed','Cancelled','Completed')),
  CHECK (end_date > start_date),                          -- BR7
  EXCLUDE USING gist (car_id WITH =,
    tsrange(start_date, end_date) WITH &&)                -- BR2
    WHERE (status <> 'Cancelled')
);
```

**Slide 13: Easy**
```sql
SELECT brand, model, daily_rate FROM car
WHERE status = 'Available' ORDER BY daily_rate;          -- 5 rows
UPDATE car SET status = 'Available' WHERE license_plate = 'นค 1122';
```

**Slide 14: Medium**
```sql
SELECT t.type_name, COUNT(c.car_id) AS cars, ROUND(AVG(c.daily_rate),2) AS avg_rate
FROM car_type t LEFT JOIN car c ON c.car_type_id = t.car_type_id
GROUP BY t.type_name ORDER BY avg_rate DESC;
-- Van 2900 | SUV 2400 | Sedan 1650 | Eco Car 925
```

**Slide 15: Complex**
```sql
WITH paid AS (SELECT booking_id, SUM(amount) paid
              FROM payment WHERE status='Paid' GROUP BY booking_id)
SELECT r.rental_id, r.total_amount - COALESCE(p.paid,0) AS outstanding
FROM rental r LEFT JOIN paid p USING (booking_id)
WHERE r.total_amount - COALESCE(p.paid,0) > 0;  -- 9500, 5400 (run before C5)
```

**Slide 16: Constraint test**
```sql
INSERT INTO booking (customer_id, car_id, start_date, end_date)
VALUES (3, 1, '2026-10-21 10:00', '2026-10-24 10:00');
-- ERROR: conflicting key value violates exclusion constraint "no_overlap"
```

## 4. Who presents what (4 speakers × ~2.5 minutes)

| Speaker | Slides | Focus |
|---|---|---|
| สิทธิพันธุ์ | 1-4 | Problem, objectives, requirements |
| จิราธิวัชร | 5-7 | Software choice, workflow, business rules |
| ภรัมพรหม | 8-12 | ERD, normalization, data dictionary, DDL, sample data |
| พูนพิพัฒน์ | 13-18 | Live SQL tests, constraint demo, conclusion, Q&A |

**Strongest moment:** on slide 16, run the overlapping booking live and let the error appear. It shows the database enforcing BR2 by itself.

## 5. Likely questions

- *Why are BOOKING and RENTAL separate tables?* A booking is the intent and can be cancelled. A rental is the actual pickup and return. Splitting them keeps 0..1 rentals per booking and lets deposits be paid before pickup.
- *How is BR6 (rent only Available cars) enforced?* The availability query (C3) filters on status and date overlap. The EXCLUDE constraint is the hard guarantee against double booking.
- *Why PostgreSQL rather than MySQL?* MySQL has no `EXCLUDE` constraint, so preventing overlapping bookings would need triggers.
