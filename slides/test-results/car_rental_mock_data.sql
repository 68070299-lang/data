-- Car Rental Mock Data (MySQL 8 / MariaDB)
SET NAMES utf8mb4;
DROP TABLE IF EXISTS PAYMENT; DROP TABLE IF EXISTS RENTAL; DROP TABLE IF EXISTS BOOKING;
DROP TABLE IF EXISTS CAR; DROP TABLE IF EXISTS CUSTOMER; DROP TABLE IF EXISTS CAR_TYPE;

CREATE TABLE CAR_TYPE (
  CarTypeID INT PRIMARY KEY,
  TypeName VARCHAR(50) NOT NULL,
  Description VARCHAR(255)
);
CREATE TABLE CAR (
  CarID INT PRIMARY KEY,
  CarTypeID INT NOT NULL,
  LicensePlate VARCHAR(30) NOT NULL UNIQUE,
  Brand VARCHAR(50), Model VARCHAR(50), Color VARCHAR(30),
  DailyRate DECIMAL(10,2) NOT NULL,
  Status VARCHAR(20) NOT NULL,
  FOREIGN KEY (CarTypeID) REFERENCES CAR_TYPE(CarTypeID)
);
CREATE TABLE CUSTOMER (
  CustomerID INT PRIMARY KEY,
  Name VARCHAR(100) NOT NULL,
  Phone VARCHAR(20), Email VARCHAR(100),
  LicenseNo VARCHAR(20) NOT NULL UNIQUE
);
CREATE TABLE BOOKING (
  BookingID INT PRIMARY KEY,
  CustomerID INT NOT NULL, CarID INT NOT NULL,
  BookingDate DATETIME NOT NULL, StartDate DATETIME NOT NULL, EndDate DATETIME NOT NULL,
  DepositAmount DECIMAL(10,2), Status VARCHAR(20) NOT NULL,
  FOREIGN KEY (CustomerID) REFERENCES CUSTOMER(CustomerID),
  FOREIGN KEY (CarID) REFERENCES CAR(CarID)
);
CREATE TABLE RENTAL (
  RentalID INT PRIMARY KEY,
  BookingID INT NOT NULL UNIQUE,
  ActualRentDate DATETIME NOT NULL, ActualReturnDate DATETIME NULL,
  TotalAmount DECIMAL(10,2), Status VARCHAR(20) NOT NULL,
  FOREIGN KEY (BookingID) REFERENCES BOOKING(BookingID)
);
CREATE TABLE PAYMENT (
  PaymentID INT PRIMARY KEY,
  BookingID INT NOT NULL, RentalID INT NULL,
  PaymentDate DATETIME NOT NULL, Amount DECIMAL(10,2) NOT NULL,
  PaymentMethod VARCHAR(30), PaymentType VARCHAR(30), Status VARCHAR(20),
  FOREIGN KEY (BookingID) REFERENCES BOOKING(BookingID),
  FOREIGN KEY (RentalID) REFERENCES RENTAL(RentalID)
);

INSERT INTO CAR_TYPE (CarTypeID, TypeName, Description) VALUES
(1,'Eco Car','รถประหยัดน้ำมัน ขนาดเล็ก เหมาะขับในเมือง'),
(2,'Sedan','รถเก๋ง 4 ประตู นั่งสบาย 5 ที่นั่ง'),
(3,'Hatchback','รถ 5 ประตู คล่องตัว จอดง่าย'),
(4,'Compact SUV','SUV ขนาดเล็ก ใต้ท้องสูง'),
(5,'SUV','SUV 7 ที่นั่ง เหมาะเดินทางไกล'),
(6,'Pickup Single Cab','กระบะตอนเดียว สำหรับขนของ'),
(7,'Pickup Double Cab','กระบะ 4 ประตู นั่งได้ 5 คน'),
(8,'MPV','รถอเนกประสงค์ 7 ที่นั่ง เหมาะครอบครัว'),
(9,'Van','รถตู้ 10-12 ที่นั่ง สำหรับกรุ๊ปทัวร์'),
(10,'Luxury Sedan','รถเก๋งหรู สำหรับผู้บริหารหรืองานพิธี'),
(11,'Luxury SUV','SUV ระดับพรีเมียม'),
(12,'EV','รถยนต์ไฟฟ้า 100%'),
(13,'Hybrid','รถไฮบริด ประหยัดน้ำมัน'),
(14,'Crossover','ผสมระหว่างเก๋งและ SUV'),
(15,'Coupe','รถสปอร์ต 2 ประตู'),
(16,'Convertible','รถเปิดประทุน'),
(17,'Minibus','รถมินิบัส 20 ที่นั่ง'),
(18,'Wagon','รถทรงสเตชันแวกอน พื้นที่เก็บของมาก'),
(19,'Microcar','รถขนาดเล็กพิเศษ 2 ที่นั่ง'),
(20,'Off-road 4x4','รถขับเคลื่อน 4 ล้อ สำหรับทางลุยบุกป่า');

INSERT INTO CAR (CarID, CarTypeID, LicensePlate, Brand, Model, Color, DailyRate, Status) VALUES
(1,1,'1กข 1234 กรุงเทพมหานคร','Toyota','Yaris Ativ','ขาว',900.00,'Rented'),
(2,2,'2กค 5678 กรุงเทพมหานคร','Honda','City','เทา',1100.00,'Available'),
(3,3,'3ขง 9012 กรุงเทพมหานคร','Honda','City Hatchback','แดง',1100.00,'Maintenance'),
(4,4,'4คจ 3456 กรุงเทพมหานคร','Toyota','Yaris Cross','น้ำเงิน',1400.00,'Available'),
(5,5,'5ฆฉ 7890 กรุงเทพมหานคร','Toyota','Fortuner','ดำ',2200.00,'Available'),
(6,6,'ผบ 2468 กรุงเทพมหานคร','Isuzu','D-Max Spark','ขาว',1000.00,'Available'),
(7,7,'1ฒท 1357 กรุงเทพมหานคร','Ford','Ranger Wildtrak','ส้ม',1800.00,'Rented'),
(8,8,'6งช 8642 กรุงเทพมหานคร','Toyota','Innova Zenix','เงิน',2000.00,'Available'),
(9,9,'30-4521 กรุงเทพมหานคร','Toyota','Commuter','ขาว',2800.00,'Available'),
(10,10,'7ชซ 1111 กรุงเทพมหานคร','Mercedes-Benz','E300e','ดำ',5500.00,'Available'),
(11,11,'8ซฌ 9999 กรุงเทพมหานคร','BMW','X5','เทา',6500.00,'Available'),
(12,12,'9ญฐ 2024 กรุงเทพมหานคร','BYD','Atto 3','น้ำเงิน',1600.00,'Available'),
(13,13,'1ฐด 7531 กรุงเทพมหานคร','Honda','Civic e:HEV','ขาว',1700.00,'Available'),
(14,14,'2ดต 1590 กรุงเทพมหานคร','Mazda','CX-30','แดง',1500.00,'Rented'),
(15,15,'3ตถ 7777 กรุงเทพมหานคร','Ford','Mustang','เหลือง',5000.00,'Maintenance'),
(16,16,'4ถท 3030 กรุงเทพมหานคร','MINI','Cooper Convertible','เขียว',4000.00,'Available'),
(17,17,'40-8812 กรุงเทพมหานคร','Hyundai','H-1','เงิน',2500.00,'Available'),
(18,18,'5ทธ 6060 กรุงเทพมหานคร','Volvo','V60','น้ำตาล',3000.00,'Available'),
(19,19,'6นบ 4242 กรุงเทพมหานคร','Wuling','Air EV','ชมพู',800.00,'Available'),
(20,20,'7บป 8080 กรุงเทพมหานคร','Suzuki','Jimny','เขียว',2300.00,'Rented');

INSERT INTO CUSTOMER (CustomerID, Name, Phone, Email, LicenseNo) VALUES
(1,'สมชาย ใจดี','082-137-1271','somchai.j@hotmail.com','64048271'),
(2,'สมหญิง รักไทย','083-174-1542','somying.r@outlook.com','64096542'),
(3,'ธนากร ศรีสุข','081-211-1813','thanakorn.s@yahoo.com','64144813'),
(4,'พิมพ์ชนก วงศ์ทอง','082-248-2084','pimchanok.w@gmail.com','64193084'),
(5,'กิตติพงษ์ แสงอรุณ','083-285-2355','kittipong.s@hotmail.com','64241355'),
(6,'ณัฐธิดา บุญมา','081-322-2626','nattida.b@outlook.com','64289626'),
(7,'วีรยุทธ ทองคำ','082-359-2897','weerayut.t@yahoo.com','64337897'),
(8,'ปิยะนุช มีสุข','083-396-3168','piyanuch.m@gmail.com','64386168'),
(9,'อนุชา พรหมมา','081-433-3439','anucha.p@hotmail.com','64434439'),
(10,'กมลวรรณ ศักดิ์ดี','082-470-3710','kamonwan.s@outlook.com','64482710'),
(11,'ชยพล อินทร์แก้ว','083-507-3981','chayapol.i@yahoo.com','64530981'),
(12,'ศิริพร จันทร์เพ็ญ','081-544-4252','siriporn.j@gmail.com','64579252'),
(13,'ภานุวัฒน์ สุวรรณ','082-581-4523','panuwat.s@hotmail.com','64627523'),
(14,'รัตนา เกษมสันต์','083-618-4794','rattana.k@outlook.com','64675794'),
(15,'ธีรวัฒน์ ชัยมงคล','081-655-5065','teerawat.c@yahoo.com','64724065'),
(16,'อรอุมา ปัญญาดี','082-692-5336','onuma.p@gmail.com','64772336'),
(17,'ณัฐพล เจริญผล','083-729-5607','nattapon.j@hotmail.com','64820607'),
(18,'สุภาวดี ทิพย์รัตน์','081-766-5878','supawadee.t@outlook.com','64868878'),
(19,'จิรายุ ประเสริฐ','082-803-6149','jirayu.p@yahoo.com','64917149'),
(20,'วรรณภา นาคสวัสดิ์','083-840-6420','wannapa.n@gmail.com','64965420');

INSERT INTO BOOKING (BookingID, CustomerID, CarID, BookingDate, StartDate, EndDate, DepositAmount, Status) VALUES
(1,4,8,'2026-08-01 10:13:00','2026-08-04 09:00:00','2026-08-10 09:00:00',3000.00,'Completed'),
(2,7,15,'2026-08-04 11:26:00','2026-08-07 09:00:00','2026-08-12 09:00:00',5000.00,'Completed'),
(3,10,2,'2026-08-07 12:39:00','2026-08-10 09:00:00','2026-08-14 09:00:00',2000.00,'Completed'),
(4,13,9,'2026-08-10 13:52:00','2026-08-13 09:00:00','2026-08-16 09:00:00',3000.00,'Completed'),
(5,16,16,'2026-08-13 14:05:00','2026-08-16 09:00:00','2026-08-18 09:00:00',5000.00,'Completed'),
(6,19,3,'2026-08-16 15:18:00','2026-08-19 09:00:00','2026-08-20 09:00:00',2000.00,'Completed'),
(7,2,10,'2026-08-19 16:31:00','2026-08-22 09:00:00','2026-08-28 09:00:00',5000.00,'Completed'),
(8,5,17,'2026-08-22 09:44:00','2026-08-25 09:00:00','2026-08-30 09:00:00',3000.00,'Completed'),
(9,8,4,'2026-08-25 10:57:00','2026-08-28 09:00:00','2026-09-01 09:00:00',2000.00,'Completed'),
(10,11,11,'2026-08-28 11:10:00','2026-08-31 09:00:00','2026-09-03 09:00:00',5000.00,'Completed'),
(11,14,18,'2026-08-31 12:23:00','2026-09-03 09:00:00','2026-09-05 09:00:00',5000.00,'Completed'),
(12,17,5,'2026-09-03 13:36:00','2026-09-06 09:00:00','2026-09-07 09:00:00',3000.00,'Completed'),
(13,20,12,'2026-09-06 14:49:00','2026-09-09 09:00:00','2026-09-15 09:00:00',3000.00,'Completed'),
(14,3,19,'2026-09-09 15:02:00','2026-09-12 09:00:00','2026-09-17 09:00:00',2000.00,'Completed'),
(15,6,6,'2026-09-12 16:15:00','2026-09-15 09:00:00','2026-09-19 09:00:00',2000.00,'Completed'),
(16,9,13,'2026-09-15 09:28:00','2026-09-18 09:00:00','2026-09-21 09:00:00',3000.00,'Completed'),
(17,12,20,'2026-10-03 10:15:00','2026-10-07 09:00:00','2026-10-13 09:00:00',3000.00,'In Progress'),
(18,15,7,'2026-10-04 11:15:00','2026-10-08 09:00:00','2026-10-13 09:00:00',3000.00,'In Progress'),
(19,18,14,'2026-10-05 12:15:00','2026-10-09 09:00:00','2026-10-13 09:00:00',3000.00,'In Progress'),
(20,1,1,'2026-10-06 13:15:00','2026-10-10 09:00:00','2026-10-13 09:00:00',2000.00,'In Progress');

INSERT INTO RENTAL (RentalID, BookingID, ActualRentDate, ActualReturnDate, TotalAmount, Status) VALUES
(1,1,'2026-08-04 09:17:00','2026-08-10 08:49:00',12000.00,'Completed'),
(2,2,'2026-08-07 09:24:00','2026-08-12 08:38:00',25000.00,'Completed'),
(3,3,'2026-08-10 09:31:00','2026-08-14 08:27:00',4400.00,'Completed'),
(4,4,'2026-08-13 09:38:00','2026-08-16 14:20:00',11200.00,'Completed'),
(5,5,'2026-08-16 09:45:00','2026-08-18 08:55:00',8000.00,'Completed'),
(6,6,'2026-08-19 09:12:00','2026-08-20 08:44:00',1100.00,'Completed'),
(7,7,'2026-08-22 09:19:00','2026-08-28 08:33:00',33000.00,'Completed'),
(8,8,'2026-08-25 09:26:00','2026-08-30 08:22:00',12500.00,'Completed'),
(9,9,'2026-08-28 09:33:00','2026-09-01 08:11:00',5600.00,'Completed'),
(10,10,'2026-08-31 09:40:00','2026-09-03 08:50:00',19500.00,'Completed'),
(11,11,'2026-09-03 09:47:00','2026-09-05 14:20:00',9000.00,'Completed'),
(12,12,'2026-09-06 09:14:00','2026-09-07 08:28:00',2200.00,'Completed'),
(13,13,'2026-09-09 09:21:00','2026-09-15 08:17:00',9600.00,'Completed'),
(14,14,'2026-09-12 09:28:00','2026-09-17 08:56:00',4000.00,'Completed'),
(15,15,'2026-09-15 09:35:00','2026-09-19 08:45:00',4000.00,'Completed'),
(16,16,'2026-09-18 09:42:00','2026-09-21 08:34:00',5100.00,'Completed'),
(17,17,'2026-10-07 09:49:00',NULL,13800.00,'Ongoing'),
(18,18,'2026-10-08 09:16:00',NULL,9000.00,'Ongoing'),
(19,19,'2026-10-09 09:23:00',NULL,6000.00,'Ongoing'),
(20,20,'2026-10-10 09:30:00',NULL,2700.00,'Ongoing');

INSERT INTO PAYMENT (PaymentID, BookingID, RentalID, PaymentDate, Amount, PaymentMethod, PaymentType, Status) VALUES
(1,1,1,'2026-08-10 09:04:00',12000.00,'PromptPay','Full Payment','Paid'),
(2,2,2,'2026-08-12 08:53:00',25000.00,'Bank Transfer','Full Payment','Paid'),
(3,3,3,'2026-08-14 08:42:00',4400.00,'Cash','Full Payment','Paid'),
(4,4,4,'2026-08-16 14:35:00',11200.00,'Credit Card','Full Payment','Paid'),
(5,5,5,'2026-08-18 09:10:00',8000.00,'PromptPay','Full Payment','Paid'),
(6,6,6,'2026-08-20 08:59:00',1100.00,'Bank Transfer','Full Payment','Paid'),
(7,7,7,'2026-08-28 08:48:00',33000.00,'Cash','Full Payment','Paid'),
(8,8,8,'2026-08-30 08:37:00',12500.00,'Credit Card','Full Payment','Paid'),
(9,9,9,'2026-09-01 08:26:00',5600.00,'PromptPay','Full Payment','Paid'),
(10,10,10,'2026-09-03 09:05:00',19500.00,'Bank Transfer','Full Payment','Paid'),
(11,11,11,'2026-09-05 14:35:00',9000.00,'Cash','Full Payment','Paid'),
(12,12,12,'2026-09-07 08:43:00',2200.00,'Credit Card','Full Payment','Paid'),
(13,13,13,'2026-09-15 08:32:00',9600.00,'PromptPay','Full Payment','Paid'),
(14,14,14,'2026-09-17 09:11:00',4000.00,'Bank Transfer','Full Payment','Paid'),
(15,15,15,'2026-09-19 09:00:00',4000.00,'Cash','Full Payment','Paid'),
(16,16,16,'2026-09-21 08:49:00',5100.00,'Credit Card','Full Payment','Pending'),
(17,17,NULL,'2026-10-03 10:20:00',3000.00,'PromptPay','Deposit','Paid'),
(18,18,NULL,'2026-10-04 11:20:00',3000.00,'Bank Transfer','Deposit','Paid'),
(19,19,NULL,'2026-10-05 12:20:00',3000.00,'Cash','Deposit','Paid'),
(20,20,NULL,'2026-10-06 13:20:00',2000.00,'Credit Card','Deposit','Paid');
