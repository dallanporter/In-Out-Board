-- MySQL dump 10.13  Distrib 5.6.19, for osx10.7 (i386)
--
-- Host: localhost    Database: inoutboard
-- ------------------------------------------------------
-- Server version	5.6.21

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `groups`
--

DROP TABLE IF EXISTS `groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `groups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(45) DEFAULT NULL,
  `password` varchar(45) DEFAULT NULL,
  `read_token` varchar(45) DEFAULT NULL,
  `readwrite_token` varchar(45) DEFAULT NULL,
  `created` datetime DEFAULT NULL,
  `font` varchar(45) DEFAULT NULL,
  `title` varchar(45) DEFAULT NULL,
  `logo` varchar(45) DEFAULT NULL,
  `type` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `groups`
--

LOCK TABLES `groups` WRITE;
/*!40000 ALTER TABLE `groups` DISABLE KEYS */;
INSERT INTO `groups` VALUES (1,'testgroup','C9ma2As1804ffcf60fcb28a618454ef35d189494e','token123','token456','2013-03-07 18:30:14','font1',NULL,NULL,'FREE');
/*!40000 ALTER TABLE `groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(45) DEFAULT NULL,
  `remark` varchar(255) DEFAULT NULL,
  `button_cell` varchar(45) DEFAULT NULL,
  `button_cell_pos` float DEFAULT NULL,
  `color` varchar(45) DEFAULT NULL,
  `custombutton` varchar(45) DEFAULT NULL,
  `sort_order` int(11) DEFAULT NULL,
  `extension` varchar(45) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=469 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Jan','6','vac',50,'#0f703c',NULL,7,'801','dallan@xmission.com'),(5,'Oscar','','out',50,'#9966ff',NULL,9,'',''),(8,'Holly','you are too good go back','in',50,'#000000',NULL,5,'',''),(9,'Pam','  ','5pm',50,'#14c9c9',NULL,1,'',''),(46,'Angela','buttfarts at 2','10am',50,'#0c4d2c',NULL,6,'420',''),(50,'Michael','Back at Noon','blank',50,'#ff0000',NULL,3,'',''),(51,'Jim','George','vac',50,'#000000',NULL,2,'',''),(52,'Ryan','Vacation all week','3pm',50,'#02c436',NULL,8,'',''),(53,'Dwight','School day','name',50,'#b09d61',NULL,4,'232',''),(74,'Darryl','court','9am',50,'#0288d6',NULL,10,'warehouse',''),(75,'Toby','','5pm',50,'#c91e6e',NULL,11,NULL,''),(76,'Stanley','','3pm',50,'#169e1f',NULL,12,NULL,''),(77,'Meredith','meeting','in',50,'#4f462e',NULL,13,NULL,''),(78,'Creed','','in',50,'#2b00ff',NULL,14,NULL,''),(79,'David','Out','5pm',50,'#744a7d',NULL,15,NULL,'');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users_to_groups`
--

DROP TABLE IF EXISTS `users_to_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users_to_groups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userid` int(11) DEFAULT NULL,
  `groupid` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=469 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users_to_groups`
--

LOCK TABLES `users_to_groups` WRITE;
/*!40000 ALTER TABLE `users_to_groups` DISABLE KEYS */;
INSERT INTO `users_to_groups` VALUES (1,1,1),(2,2,1),(3,3,1),(4,4,1),(5,5,1),(6,6,1),(7,7,1),(8,8,1),(9,9,1),(10,10,1),(11,11,1),(12,12,1),(13,13,1),(14,14,1),(15,15,1),(16,16,1),(45,45,1),(46,46,1),(47,47,1),(48,48,1),(49,49,1),(50,50,1),(51,51,1),(52,52,1),(53,53,1),(54,54,1),(55,55,1),(56,56,1),(57,57,1),(58,58,1),(59,59,1),(74,74,1),(75,75,1),(76,76,1),(77,77,1),(78,78,1),(79,79,1);
/*!40000 ALTER TABLE `users_to_groups` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2015-04-23 19:39:50
