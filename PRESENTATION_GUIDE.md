# Online Car Rental System: presentation guide

Presentation: **13 Oct 2569, 09:00** (2 points). Report deadline: **12 Oct 2569, 23:59** on Onlearn (8 points).

## 1. How the deck maps to the rubric

Slide numbers refer to the 25-slide Claude Slides deck (https://claude.ai/artifact/4o5MJH76DLEPCygBXk2s7t).

| Rubric item (8-point report / 2-point presentation) | Slide(s) |
|---|---|
| 1) บทนำ ที่มาของปัญหา ความสำคัญ | 2, 3 |
| 2) ทฤษฎีที่เกี่ยวข้อง | 4 (ERD, Normalization, Data Dictionary) |
| 3) การออกแบบฐานข้อมูลจากความต้องการผู้ใช้ | 5, 7–9 (workflow and sequence diagram), 10 (business rules), 11 (ERD), 12–14 (1NF, 2NF, 3NF), 15–17 (data dictionary, all 6 tables) |
| **การเลือกใช้ซอฟต์แวร์ที่เหมาะสม** | 6 |
| **ขั้นตอนการสร้างฐานข้อมูล (SQL-DDL)** | 18 |
| **ตัวอย่างข้อมูลที่เหมาะสม** | 19 |
| **ทดสอบ SQL DDL/DML ง่าย / กลาง / ซับซ้อน, 5-10 คำสั่งต่อระดับ** | 20 (6 easy), 21 (6 medium, M6 is the DDL test `CREATE VIEW`), 22 + 23 (7 complex) |
| 5) สรุปและประเมินผล | 24 |

> **The report has gaps.** Chapters 4 (การสร้างฐานข้อมูลและการทดสอบ) and 5 (สรุป) are missing, and so is all of the SQL the rubric scores.
> `sql/car_rental.sql` fills them. Paste it into Chapter 4, together with screenshots of the results from `sql/test_results.txt`.

## 2. Workflow from start to finish

The main deck is the Claude Slides artifact above (25 slides, IBM Plex Sans Thai). Export it with **Share → Export → Send to Canva**, or download PPTX/PDF.
`presentation/Online_Car_Rental_System.pptx` is an earlier 18-slide version (Kanit/Sarabun) and does not include the review fixes; use it only as a fallback.
Every diagram is drawn natively, so it stays sharp and editable: ERD, 5-step workflow, normalization, data dictionary, business-rule table and the M2 result chart.

1. **Send to Canva** from the artifact, or import the downloaded `.pptx` via Canva home → **Create** → **Import file**.
2. **Check every slide** after import and fix any text that shifted.
3. **Optional:** add screenshots of the real results from psql or Supabase next to the result tables on slides 20–23.
4. **Rehearse** with Canva *Present → Presenter view*. Thai speaker notes are already on every slide. Aim for about 10 minutes.
5. **Back up:** bring the PDF in case the projector has no internet.
6. **Regenerate the deck** if needed: `presentation/build_deck.js` (pptxgenjs).

## 3. SQL used on the slides (every query has been tested on PostgreSQL 16 with psql)

**Slide 18: DDL**
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
  CONSTRAINT chk_booking_dates CHECK (end_date > start_date),   -- BR7
  CONSTRAINT no_overlap EXCLUDE USING gist (car_id WITH =,
    tsrange(start_date, end_date) WITH &&)                       -- BR2
    WHERE (status <> 'Cancelled')
);
```

**Slide 20: Easy**
```sql
SELECT brand, model, daily_rate FROM car
WHERE status = 'Available' ORDER BY daily_rate;          -- 5 rows
UPDATE car SET status = 'Available' WHERE license_plate = 'นค 1122';
```

**Slide 21: Medium**
```sql
SELECT t.type_name, COUNT(c.car_id) AS cars, ROUND(AVG(c.daily_rate),2) AS avg_rate
FROM car_type t LEFT JOIN car c ON c.car_type_id = t.car_type_id
GROUP BY t.type_name ORDER BY avg_rate DESC;
-- Van 2900 | SUV 2400 | Sedan 1650 | Eco Car 925

-- M6: DDL test
CREATE VIEW v_active_rentals AS
SELECT ca.license_plate, ca.model, cu.name, b.end_date::date AS due_date
FROM rental r JOIN booking b ON b.booking_id = r.booking_id
  JOIN car ca ON ca.car_id = b.car_id
  JOIN customer cu ON cu.customer_id = b.customer_id
WHERE r.status = 'Active';
SELECT * FROM v_active_rentals ORDER BY due_date;   -- 2 rows
```

**Slide 22: Complex**
```sql
WITH paid AS (SELECT booking_id, SUM(amount) paid
              FROM payment WHERE status='Paid' GROUP BY booking_id)
SELECT r.rental_id, cu.name, r.total_amount,
       r.total_amount - COALESCE(p.paid,0) AS outstanding
FROM rental r JOIN booking b USING (booking_id)
  JOIN customer cu USING (customer_id)
  LEFT JOIN paid p USING (booking_id)
WHERE r.total_amount - COALESCE(p.paid,0) > 0;  -- 9500, 5400 (run before C5)
```

**Slide 23: Constraint test**
```sql
INSERT INTO booking (customer_id, car_id, start_date, end_date)
VALUES (3, 1, '2026-10-21 10:00', '2026-10-24 10:00');
-- ERROR: conflicting key value violates exclusion constraint "no_overlap"
```

## 4. Who presents what (4 speakers × ~2.5 minutes)

| Speaker | Slides | Focus |
|---|---|---|
| สิทธิพันธุ์ | 1-6 | Problem, objectives, theory, requirements, software |
| จิราธิวัชร | 7-11 | Workflow, sequence diagram, business rules, ERD |
| ภรัมพรหม | 12-19 | Normalization, data dictionary, DDL, sample data |
| พูนพิพัฒน์ | 20-25 | Live SQL tests, constraint demo, conclusion, Q&A |

**Strongest moment:** on slide 23, run the overlapping booking live and let the error appear. It shows the database enforcing BR2 by itself.

## 5. Likely questions

- *Why are BOOKING and RENTAL separate tables?* A booking is the intent and can be cancelled. A rental is the actual pickup and return. Splitting them keeps 0..1 rentals per booking and lets deposits be paid before pickup.
- *How is BR6 (rent only Available cars) enforced?* At application level: E1 lists only cars with status `Available`. It is not a database constraint yet (listed as a limitation). The EXCLUDE constraint is the hard guarantee against double booking.
- *Is 2NF really needed here?* Every table has a single-column primary key, so there is no partial dependency. The real split happens at 3NF: BookingID → CustomerID → Name and CarID → CarTypeID → TypeName are transitive dependencies. Note that the report's normalization figure calls the first one "partial"; fix that in the report too.
- *Why does PAYMENT store both booking_id and rental_id?* A deposit is paid before pickup, when no rental exists yet, so rental_id is nullable. It is a deliberate trade-off.
- *What does "30 constraints" count?* PK 6, FK 6, UNIQUE 5, CHECK 12, EXCLUDE 1. NOT NULL is not counted.
- *Why PostgreSQL rather than MySQL?* MySQL has no `EXCLUDE` constraint, so preventing overlapping bookings would need triggers.
