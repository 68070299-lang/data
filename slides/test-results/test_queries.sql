-- =====================================================================
--  ชุดคำสั่ง SQL สำหรับทดสอบฐานข้อมูลระบบบริการปล่อยเช่ารถ
--  ใช้กับไฟล์ car_rental_mock_data.sql (MySQL 8 / MariaDB 10.2+)
-- =====================================================================


-- =====================================================================
-- 4.4 การทดสอบคำสั่ง SQL ระดับ Easy
--     เน้นคำสั่งพื้นฐานสำหรับการเรียกดู ค้นหา เรียงลำดับ และนับข้อมูลในตารางเดียว
-- =====================================================================

-- 4.4.1 แสดงข้อมูลลูกค้าทั้งหมด
SELECT CustomerID, Name, Phone, Email, LicenseNo
FROM CUSTOMER;

-- 4.4.2 ค้นหารถที่มีค่าเช่ารายวันตั้งแต่ 2,000 บาทขึ้นไป
SELECT CarID, Brand, Model, LicensePlate, DailyRate
FROM CAR
WHERE DailyRate >= 2000
ORDER BY DailyRate DESC;

-- 4.4.3 แสดงรายการรถที่พร้อมให้เช่า
SELECT CarID, Brand, Model, Color, DailyRate
FROM CAR
WHERE Status = 'Available'
ORDER BY CarID;

-- 4.4.4 นับจำนวนรถที่กำลังถูกเช่าอยู่
SELECT COUNT(*) AS rented_cars
FROM CAR
WHERE Status = 'Rented';

-- 4.4.5 แสดงรายการจองที่เริ่มเช่าในเดือนตุลาคม 2569
SELECT BookingID, CustomerID, CarID, StartDate, EndDate, Status
FROM BOOKING
WHERE StartDate BETWEEN '2026-10-01 00:00:00' AND '2026-10-31 23:59:59'
ORDER BY StartDate;


-- =====================================================================
-- 4.5 การทดสอบคำสั่ง SQL ระดับ Medium
--     เน้นการเชื่อมโยงข้อมูลระหว่างตาราง การจัดกลุ่มข้อมูล
--     และการใช้ Aggregate Functions
-- =====================================================================

-- 4.5.1 แสดงการจองพร้อมชื่อลูกค้าและข้อมูลรถ
SELECT b.BookingID,
       c.Name AS customer_name, c.Phone,
       car.Brand, car.Model, car.LicensePlate,
       b.StartDate, b.EndDate, b.Status
FROM BOOKING b
INNER JOIN CUSTOMER c ON c.CustomerID = b.CustomerID
INNER JOIN CAR car    ON car.CarID    = b.CarID
ORDER BY b.StartDate;

-- 4.5.2 สรุปจำนวนและยอดชำระเงินแยกตามช่องทางการชำระ
SELECT PaymentMethod,
       COUNT(*)    AS payment_count,
       SUM(Amount) AS total_amount
FROM PAYMENT
WHERE Status = 'Paid'
GROUP BY PaymentMethod
ORDER BY total_amount DESC;

-- 4.5.3 สรุปจำนวนการเช่าและรายได้ของแต่ละประเภทรถ
SELECT ct.TypeName,
       COUNT(r.RentalID)            AS rental_count,
       COALESCE(SUM(r.TotalAmount), 0) AS total_revenue
FROM CAR_TYPE ct
LEFT JOIN CAR car  ON car.CarTypeID = ct.CarTypeID
LEFT JOIN BOOKING b ON b.CarID      = car.CarID
LEFT JOIN RENTAL r  ON r.BookingID  = b.BookingID
GROUP BY ct.CarTypeID, ct.TypeName
ORDER BY total_revenue DESC, ct.TypeName;

-- 4.5.4 ค้นหาการเช่าที่คืนรถช้ากว่ากำหนด
SELECT r.RentalID, b.BookingID, c.Name AS customer_name,
       b.EndDate          AS due_return,
       r.ActualReturnDate AS actual_return,
       r.TotalAmount
FROM RENTAL r
JOIN BOOKING b  ON b.BookingID  = r.BookingID
JOIN CUSTOMER c ON c.CustomerID = b.CustomerID
WHERE r.ActualReturnDate > b.EndDate
ORDER BY r.RentalID;

-- 4.5.5 แสดงการเช่าที่ยังไม่คืนรถ พร้อมจำนวนวันที่เช่ามาแล้ว (นับถึงวันที่ 12 ต.ค. 2569)
SELECT r.RentalID, c.Name AS customer_name,
       car.Brand, car.Model, car.LicensePlate,
       r.ActualRentDate, b.EndDate AS due_return,
       DATEDIFF('2026-10-12', r.ActualRentDate) AS days_rented
FROM RENTAL r
JOIN BOOKING b  ON b.BookingID  = r.BookingID
JOIN CUSTOMER c ON c.CustomerID = b.CustomerID
JOIN CAR car    ON car.CarID    = b.CarID
WHERE r.ActualReturnDate IS NULL
ORDER BY b.EndDate;


-- =====================================================================
-- 4.6 การทดสอบคำสั่ง SQL ระดับ Complex
--     ใช้คำสั่งหลายส่วน เช่น การเชื่อมโยงหลายตาราง, CTE, Subquery,
--     Window Function, Self Join และการตรวจสอบความสอดคล้องของข้อมูล
-- =====================================================================

-- 4.6.1 แสดงรายละเอียดการเช่าครบวงจร (ลูกค้า – รถ – ประเภท – การเช่า – การชำระเงิน)
SELECT b.BookingID,
       c.Name       AS customer_name,
       ct.TypeName  AS car_type,
       CONCAT(car.Brand, ' ', car.Model) AS car,
       r.ActualRentDate, r.ActualReturnDate,
       r.TotalAmount,
       p.PaymentMethod, p.Amount AS paid_amount, p.Status AS payment_status
FROM BOOKING b
JOIN CUSTOMER c   ON c.CustomerID  = b.CustomerID
JOIN CAR car      ON car.CarID     = b.CarID
JOIN CAR_TYPE ct  ON ct.CarTypeID  = car.CarTypeID
JOIN RENTAL r     ON r.BookingID   = b.BookingID
LEFT JOIN PAYMENT p ON p.RentalID  = r.RentalID
WHERE r.Status = 'Completed'
ORDER BY r.ActualRentDate;

-- 4.6.2 ค้นหาลูกค้าที่มียอดชำระรวมสูงกว่าค่าเฉลี่ย (Subquery)
SELECT c.CustomerID, c.Name, SUM(p.Amount) AS total_paid
FROM CUSTOMER c
JOIN BOOKING b ON b.CustomerID = c.CustomerID
JOIN PAYMENT p ON p.BookingID  = b.BookingID
WHERE p.Status = 'Paid'
GROUP BY c.CustomerID, c.Name
HAVING SUM(p.Amount) > (SELECT AVG(Amount) FROM PAYMENT WHERE Status = 'Paid')
ORDER BY total_paid DESC;

-- 4.6.3 รายได้รายเดือนพร้อมยอดสะสม (CTE + Window Function)
WITH monthly AS (
    SELECT DATE_FORMAT(PaymentDate, '%Y-%m') AS pay_month,
           SUM(Amount) AS revenue
    FROM PAYMENT
    WHERE Status = 'Paid'
    GROUP BY DATE_FORMAT(PaymentDate, '%Y-%m')
)
SELECT pay_month,
       revenue,
       SUM(revenue) OVER (ORDER BY pay_month) AS cumulative_revenue
FROM monthly
ORDER BY pay_month;

-- 4.6.4 จัดอันดับรถตามรายได้ พร้อมสัดส่วนรายได้ต่อรายได้รวม (Window Function)
WITH car_revenue AS (
    SELECT car.CarID, CONCAT(car.Brand, ' ', car.Model) AS car,
           SUM(r.TotalAmount) AS revenue
    FROM CAR car
    JOIN BOOKING b ON b.CarID     = car.CarID
    JOIN RENTAL r  ON r.BookingID = b.BookingID
    GROUP BY car.CarID, car.Brand, car.Model
)
SELECT RANK() OVER (ORDER BY revenue DESC) AS revenue_rank,
       car, revenue,
       ROUND(100.0 * revenue / SUM(revenue) OVER (), 2) AS revenue_pct
FROM car_revenue
ORDER BY revenue_rank;

-- 4.6.5 ตรวจสอบการจองซ้อนทับ: รถคันเดียวกันถูกจองในช่วงเวลาที่คาบเกี่ยวกัน (Self Join)
--       ผลลัพธ์ที่ถูกต้องคือ 0 แถว
SELECT b1.CarID,
       b1.BookingID AS booking_a, b1.StartDate AS a_start, b1.EndDate AS a_end,
       b2.BookingID AS booking_b, b2.StartDate AS b_start, b2.EndDate AS b_end
FROM BOOKING b1
JOIN BOOKING b2
  ON  b1.CarID     = b2.CarID
  AND b1.BookingID < b2.BookingID
  AND b1.StartDate < b2.EndDate
  AND b2.StartDate < b1.EndDate;

-- 4.6.6 ตรวจสอบความสอดคล้องของข้อมูลการเงินและสถานะรถ
WITH checks AS (
    -- (ก) ยอดเช่าไม่ตรงกับ ค่าเช่ารายวัน × จำนวนวันที่จอง
    SELECT 'Amount mismatch' AS issue, r.RentalID AS ref_id,
           CONCAT('Total ', r.TotalAmount, ' vs expected ',
                  car.DailyRate * DATEDIFF(b.EndDate, b.StartDate)) AS detail
    FROM RENTAL r
    JOIN BOOKING b ON b.BookingID = r.BookingID
    JOIN CAR car   ON car.CarID   = b.CarID
    WHERE r.TotalAmount <> car.DailyRate * DATEDIFF(b.EndDate, b.StartDate)

    UNION ALL
    -- (ข) การเช่าที่จบแล้วแต่ยังชำระเงินไม่ครบ
    SELECT 'Unpaid rental', r.RentalID,
           CONCAT('Paid ', COALESCE(SUM(CASE WHEN p.Status = 'Paid' THEN p.Amount END), 0),
                  ' of ', r.TotalAmount)
    FROM RENTAL r
    LEFT JOIN PAYMENT p ON p.RentalID = r.RentalID
    WHERE r.Status = 'Completed'
    GROUP BY r.RentalID, r.TotalAmount
    HAVING COALESCE(SUM(CASE WHEN p.Status = 'Paid' THEN p.Amount END), 0) < r.TotalAmount

    UNION ALL
    -- (ค) สถานะรถใน CAR ไม่ตรงกับการเช่าที่ยังไม่คืน
    SELECT 'Car status mismatch', car.CarID,
           CONCAT('Status ', car.Status, ', ongoing rentals ', COUNT(r.RentalID))
    FROM CAR car
    LEFT JOIN BOOKING b ON b.CarID     = car.CarID
    LEFT JOIN RENTAL r  ON r.BookingID = b.BookingID AND r.ActualReturnDate IS NULL
    GROUP BY car.CarID, car.Status
    HAVING (car.Status = 'Rented') <> (COUNT(r.RentalID) > 0)
)
SELECT issue, ref_id, detail
FROM checks
ORDER BY issue, ref_id;


-- =====================================================================
-- (ภาคผนวก) ทดสอบข้อจำกัดของฐานข้อมูล
-- คำสั่งด้านล่าง "ต้อง error" ทุกคำสั่ง จึงเป็นการยืนยันว่า constraint ทำงาน
-- ให้รันทีละคำสั่ง (ถ้ารันพร้อมกัน สคริปต์จะหยุดที่คำสั่งแรกที่ error)
-- =====================================================================

-- ก. Foreign Key: จองด้วย CustomerID ที่ไม่มีอยู่จริง (ต้อง error)
-- INSERT INTO BOOKING VALUES (99, 999, 1, '2026-10-12 10:00:00', '2026-10-15 09:00:00', '2026-10-17 09:00:00', 2000, 'Confirmed');

-- ข. UNIQUE: ทะเบียนรถซ้ำ (ต้อง error)
-- INSERT INTO CAR VALUES (99, 1, '1กข 1234 กรุงเทพมหานคร', 'Toyota', 'Vios', 'ขาว', 900, 'Available');

-- ค. PRIMARY KEY: CustomerID ซ้ำ (ต้อง error)
-- INSERT INTO CUSTOMER VALUES (1, 'ทดสอบ ซ้ำ', '080-000-0000', 'dup@test.com', '99999999');

-- ง. UNIQUE (1 Booking มีได้ 1 Rental): สร้าง Rental ซ้ำให้ Booking 1 (ต้อง error)
-- INSERT INTO RENTAL VALUES (99, 1, '2026-10-12 10:00:00', NULL, 0, 'Ongoing');