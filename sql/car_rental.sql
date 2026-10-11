-- =====================================================================
-- Online Car Rental System  |  06066300 Database System Concepts
-- DBMS: PostgreSQL 16 (Supabase managed Postgres)
-- =====================================================================

-- ---------------------------------------------------------------------
-- PART 1: DDL  (CREATE TABLE + constraints that enforce Business Rules)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS payment, rental, booking, car, car_type, customer CASCADE;
CREATE EXTENSION IF NOT EXISTS btree_gist;   -- needed for the overlap rule (BR2)

CREATE TABLE customer (
    customer_id  SERIAL       PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    phone        VARCHAR(20)  NOT NULL,
    email        VARCHAR(100) UNIQUE,
    license_no   VARCHAR(20)  NOT NULL UNIQUE
);

CREATE TABLE car_type (
    car_type_id  SERIAL       PRIMARY KEY,
    type_name    VARCHAR(50)  NOT NULL UNIQUE,
    description  VARCHAR(255)
);

CREATE TABLE car (
    car_id        SERIAL        PRIMARY KEY,
    car_type_id   INT           NOT NULL REFERENCES car_type(car_type_id),   -- BR3
    license_plate VARCHAR(20)   NOT NULL UNIQUE,
    brand         VARCHAR(50)   NOT NULL,
    model         VARCHAR(50)   NOT NULL,
    color         VARCHAR(30),
    daily_rate    DECIMAL(10,2) NOT NULL CHECK (daily_rate > 0),
    status        VARCHAR(20)   NOT NULL DEFAULT 'Available'
                  CHECK (status IN ('Available','Rented','Maintenance'))
);

CREATE TABLE booking (
    booking_id     SERIAL        PRIMARY KEY,
    customer_id    INT           NOT NULL REFERENCES customer(customer_id),  -- BR1
    car_id         INT           NOT NULL REFERENCES car(car_id),
    booking_date   TIMESTAMP     NOT NULL DEFAULT now(),
    start_date     TIMESTAMP     NOT NULL,
    end_date       TIMESTAMP     NOT NULL,
    deposit_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),
    status         VARCHAR(20)   NOT NULL DEFAULT 'Pending'
                   CHECK (status IN ('Pending','Confirmed','Cancelled','Completed')),
    CONSTRAINT chk_booking_dates CHECK (end_date > start_date),              -- BR7
    CONSTRAINT no_overlap EXCLUDE USING gist (                               -- BR2
        car_id WITH =, tsrange(start_date, end_date) WITH &&
    ) WHERE (status <> 'Cancelled')
);

CREATE TABLE rental (
    rental_id          SERIAL        PRIMARY KEY,
    booking_id         INT           NOT NULL UNIQUE REFERENCES booking(booking_id),
    actual_rent_date   TIMESTAMP     NOT NULL,
    actual_return_date TIMESTAMP,
    total_amount       DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    status             VARCHAR(20)   NOT NULL DEFAULT 'Active'
                       CHECK (status IN ('Active','Completed')),
    CONSTRAINT chk_return CHECK (actual_return_date IS NULL
                                 OR actual_return_date >= actual_rent_date)  -- BR7
);

CREATE TABLE payment (
    payment_id     SERIAL        PRIMARY KEY,
    booking_id     INT           NOT NULL REFERENCES booking(booking_id),
    rental_id      INT           REFERENCES rental(rental_id),               -- BR5
    payment_date   TIMESTAMP     NOT NULL DEFAULT now(),
    amount         DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(20)   NOT NULL CHECK (payment_method IN ('Cash','Credit Card','QR')),
    payment_type   VARCHAR(20)   NOT NULL CHECK (payment_type IN ('Deposit','Rental Fee','Late Fee')),
    status         VARCHAR(20)   NOT NULL DEFAULT 'Paid' CHECK (status IN ('Paid','Pending'))
);

CREATE INDEX idx_car_status      ON car(status);
CREATE INDEX idx_booking_car     ON booking(car_id);
CREATE INDEX idx_payment_booking ON payment(booking_id);

-- ---------------------------------------------------------------------
-- PART 2: SAMPLE DATA
-- ---------------------------------------------------------------------
INSERT INTO car_type (type_name, description) VALUES
 ('Sedan','รถเก๋ง 4 ประตู เหมาะกับการใช้งานในเมือง'),
 ('SUV','รถอเนกประสงค์ ยกสูง เหมาะกับครอบครัว'),
 ('Van','รถตู้ 10-12 ที่นั่ง สำหรับกลุ่มใหญ่'),
 ('Eco Car','รถประหยัดน้ำมัน ราคาเช่าประหยัด');

INSERT INTO car (car_type_id, license_plate, brand, model, color, daily_rate, status) VALUES
 (1,'กข 1234','Toyota','Camry','White',1800,'Available'),
 (1,'กค 5678','Honda','Civic','Black',1500,'Rented'),
 (2,'ขก 9012','Toyota','Fortuner','Silver',2500,'Available'),
 (2,'ขข 3456','Honda','CR-V','Blue',2300,'Rented'),
 (3,'นข 7890','Toyota','Commuter','White',3000,'Available'),
 (3,'นค 1122','Hyundai','H-1','Gray',2800,'Maintenance'),
 (4,'จก 3344','Nissan','Almera','Red',900,'Available'),
 (4,'จข 5566','Toyota','Yaris Ativ','White',950,'Available');

INSERT INTO customer (name, phone, email, license_no) VALUES
 ('สมชาย ใจดี','081-111-1111','somchai@mail.com','DL-10001'),
 ('สมหญิง รักษ์ดี','082-222-2222','somying@mail.com','DL-10002'),
 ('ธนากร มั่นคง','083-333-3333','thanakorn@mail.com','DL-10003'),
 ('พิมพ์ชนก สุขใจ','084-444-4444','pimchanok@mail.com','DL-10004'),
 ('วีรภัทร ศรีสุข','085-555-5555','weeraphat@mail.com','DL-10005'),
 ('กมลชนก แสงทอง','086-666-6666','kamonchanok@mail.com','DL-10006');

INSERT INTO booking (customer_id, car_id, booking_date, start_date, end_date, deposit_amount, status) VALUES
 (1,1,'2026-08-01 09:00','2026-08-05 10:00','2026-08-08 10:00',1000,'Completed'),
 (2,3,'2026-08-03 14:00','2026-08-10 09:00','2026-08-14 09:00',1500,'Completed'),
 (1,7,'2026-08-15 11:00','2026-08-20 08:00','2026-08-22 08:00', 500,'Completed'),
 (3,5,'2026-08-18 16:00','2026-08-25 07:00','2026-08-28 07:00',2000,'Completed'),
 (4,2,'2026-09-25 10:00','2026-10-08 09:00','2026-10-15 09:00',1000,'Confirmed'),
 (5,4,'2026-09-28 13:00','2026-10-09 09:00','2026-10-12 09:00',1500,'Confirmed'),
 (2,1,'2026-10-05 19:00','2026-10-20 10:00','2026-10-23 10:00',1000,'Pending'),
 (6,8,'2026-10-06 08:00','2026-10-18 09:00','2026-10-19 09:00', 500,'Cancelled');

INSERT INTO rental (booking_id, actual_rent_date, actual_return_date, total_amount, status) VALUES
 (1,'2026-08-05 10:15','2026-08-08 09:40', 5400,'Completed'),
 (2,'2026-08-10 09:05','2026-08-14 10:30',10000,'Completed'),
 (3,'2026-08-20 08:10','2026-08-22 07:55', 1800,'Completed'),
 (4,'2026-08-25 07:00','2026-08-28 06:50', 9000,'Completed'),
 (5,'2026-10-08 09:20',NULL,              10500,'Active'),
 (6,'2026-10-09 09:00',NULL,               6900,'Active');

INSERT INTO payment (booking_id, rental_id, payment_date, amount, payment_method, payment_type, status) VALUES
 (1,NULL,'2026-08-01 09:05',1000,'QR','Deposit','Paid'),
 (1,1,   '2026-08-08 09:45',4400,'Credit Card','Rental Fee','Paid'),
 (2,NULL,'2026-08-03 14:10',1500,'Credit Card','Deposit','Paid'),
 (2,2,   '2026-08-14 10:35',8500,'Credit Card','Rental Fee','Paid'),
 (2,2,   '2026-08-14 10:36', 500,'Cash','Late Fee','Paid'),
 (3,NULL,'2026-08-15 11:05', 500,'QR','Deposit','Paid'),
 (3,3,   '2026-08-22 08:00',1300,'QR','Rental Fee','Paid'),
 (4,NULL,'2026-08-18 16:10',2000,'Cash','Deposit','Paid'),
 (4,4,   '2026-08-28 07:00',7000,'Cash','Rental Fee','Paid'),
 (5,NULL,'2026-09-25 10:05',1000,'QR','Deposit','Paid'),
 (6,NULL,'2026-09-28 13:05',1500,'Credit Card','Deposit','Paid'),
 (7,NULL,'2026-10-05 19:05',1000,'QR','Deposit','Pending');

-- ---------------------------------------------------------------------
-- PART 3: TESTING  (Easy / Medium / Complex)
-- ---------------------------------------------------------------------

-- ===== EASY (single table: SELECT / WHERE / ORDER BY / INSERT / UPDATE / DELETE)
-- E1 รถที่ว่างพร้อมให้เช่า
SELECT car_id, brand, model, daily_rate FROM car WHERE status = 'Available' ORDER BY daily_rate;
-- E2 ค้นหาลูกค้าจากเลขใบขับขี่
SELECT * FROM customer WHERE license_no = 'DL-10003';
-- E3 รถที่ค่าเช่าไม่เกิน 2,000 บาท/วัน
SELECT brand, model, daily_rate FROM car WHERE daily_rate <= 2000 ORDER BY daily_rate DESC;
-- E4 เพิ่มลูกค้าใหม่ (INSERT)
INSERT INTO customer (name, phone, email, license_no)
VALUES ('ณัฐวุฒิ ทองดี','087-777-7777','nattawut@mail.com','DL-10007');
-- E5 เปลี่ยนสถานะรถที่ซ่อมเสร็จ (UPDATE)
UPDATE car SET status = 'Available' WHERE license_plate = 'นค 1122';
-- E6 ลบลูกค้าที่ยังไม่เคยจอง (DELETE)
DELETE FROM customer WHERE license_no = 'DL-10007';

-- ===== MEDIUM (JOIN / GROUP BY / HAVING / aggregate)
-- M1 รายการจองพร้อมชื่อลูกค้าและรถ
SELECT b.booking_id, c.name, ca.brand || ' ' || ca.model AS car, b.start_date::date, b.end_date::date, b.status
FROM booking b JOIN customer c ON c.customer_id = b.customer_id
               JOIN car ca     ON ca.car_id      = b.car_id
ORDER BY b.start_date;
-- M2 จำนวนรถและค่าเช่าเฉลี่ยแต่ละประเภท
SELECT t.type_name, COUNT(c.car_id) AS cars, ROUND(AVG(c.daily_rate),2) AS avg_rate
FROM car_type t LEFT JOIN car c ON c.car_type_id = t.car_type_id
GROUP BY t.type_name ORDER BY avg_rate DESC;
-- M3 ยอดรับเงินแยกตามช่องทางการชำระ (เฉพาะที่ชำระแล้ว)
SELECT payment_method, COUNT(*) AS txns, SUM(amount) AS total
FROM payment WHERE status = 'Paid' GROUP BY payment_method ORDER BY total DESC;
-- M4 ลูกค้าที่จองมากกว่า 1 ครั้ง
SELECT c.name, COUNT(*) AS bookings
FROM customer c JOIN booking b ON b.customer_id = c.customer_id
GROUP BY c.customer_id, c.name HAVING COUNT(*) > 1;
-- M5 รถที่กำลังถูกเช่าอยู่ และกำหนดคืน
SELECT ca.license_plate, ca.model, cu.name, b.end_date::date AS due_date
FROM rental r JOIN booking b  ON b.booking_id  = r.booking_id
              JOIN car ca     ON ca.car_id      = b.car_id
              JOIN customer cu ON cu.customer_id = b.customer_id
WHERE r.status = 'Active';
-- M6 ทดสอบ DDL: สร้าง View รถที่กำลังถูกเช่า แล้วเรียกใช้
CREATE VIEW v_active_rentals AS
SELECT ca.license_plate, ca.model, cu.name, b.end_date::date AS due_date
FROM rental r JOIN booking b  ON b.booking_id  = r.booking_id
              JOIN car ca     ON ca.car_id      = b.car_id
              JOIN customer cu ON cu.customer_id = b.customer_id
WHERE r.status = 'Active';
SELECT * FROM v_active_rentals ORDER BY due_date;

-- ===== COMPLEX (subquery / CTE / window function / transaction / constraint test)
-- C1 ยอดค้างชำระของแต่ละการเช่า (CTE)
WITH paid AS (
  SELECT booking_id, SUM(amount) AS paid FROM payment WHERE status = 'Paid' GROUP BY booking_id
)
SELECT r.rental_id, cu.name, r.total_amount, COALESCE(p.paid,0) AS paid,
       r.total_amount - COALESCE(p.paid,0) AS outstanding
FROM rental r JOIN booking b   ON b.booking_id = r.booking_id
              JOIN customer cu ON cu.customer_id = b.customer_id
              LEFT JOIN paid p ON p.booking_id = b.booking_id
WHERE r.total_amount - COALESCE(p.paid,0) > 0;
-- C2 จัดอันดับรถทำรายได้สูงสุด (window function)
SELECT ca.brand || ' ' || ca.model AS car, SUM(r.total_amount) AS revenue,
       RANK() OVER (ORDER BY SUM(r.total_amount) DESC) AS rank
FROM rental r JOIN booking b ON b.booking_id = r.booking_id
              JOIN car ca    ON ca.car_id    = b.car_id
GROUP BY car;
-- C3 รถที่ว่างตลอดช่วงวันที่ลูกค้าต้องการ (NOT EXISTS + overlap)
SELECT ca.car_id, ca.brand, ca.model, ca.daily_rate
FROM car ca
WHERE ca.status <> 'Maintenance'
  AND NOT EXISTS (
    SELECT 1 FROM booking b
    WHERE b.car_id = ca.car_id AND b.status <> 'Cancelled'
      AND tsrange(b.start_date, b.end_date) && tsrange('2026-10-19','2026-10-22'));
-- C4 ลูกค้าที่ใช้จ่ายมากกว่าค่าเฉลี่ย (subquery)
SELECT cu.name, SUM(p.amount) AS spent
FROM customer cu JOIN booking b ON b.customer_id = cu.customer_id
                 JOIN payment p ON p.booking_id  = b.booking_id AND p.status = 'Paid'
GROUP BY cu.customer_id, cu.name
HAVING SUM(p.amount) > (SELECT AVG(s) FROM (SELECT SUM(p2.amount) s
                         FROM payment p2 JOIN booking b2 ON b2.booking_id = p2.booking_id
                         WHERE p2.status = 'Paid' GROUP BY b2.customer_id) x)
ORDER BY spent DESC;
-- C5 ทำรายการคืนรถทั้งกระบวนการใน TRANSACTION (ขั้นตอนที่ 5)
BEGIN;
  UPDATE rental SET actual_return_date = '2026-10-12 08:45', status = 'Completed' WHERE rental_id = 6;
  INSERT INTO payment (booking_id, rental_id, amount, payment_method, payment_type)
       VALUES (6, 6, 5400, 'Credit Card', 'Rental Fee');
  UPDATE booking SET status = 'Completed' WHERE booking_id = 6;
  UPDATE car SET status = 'Available' WHERE car_id = 4;
COMMIT;
-- C6 ทดสอบกฎ BR2: จองรถคันเดิมช่วงเวลาทับซ้อน -> ต้องถูกปฏิเสธ
INSERT INTO booking (customer_id, car_id, start_date, end_date, deposit_amount)
VALUES (3, 1, '2026-10-21 10:00', '2026-10-24 10:00', 1000);
-- C7 ทดสอบกฎ BR7: วันคืนก่อนวันเช่า -> ต้องถูกปฏิเสธ
INSERT INTO booking (customer_id, car_id, start_date, end_date)
VALUES (3, 3, '2026-11-05', '2026-11-01');
