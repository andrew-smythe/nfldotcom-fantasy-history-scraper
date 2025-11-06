-- MySQL dump 10.13  Distrib 8.0.31, for Win64 (x86_64)
--
-- Host: localhost    Database: nerdherd
-- ------------------------------------------------------
-- Server version	8.0.31

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `draftresults`
--

DROP TABLE IF EXISTS `draftresults`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `draftresults` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(1000) NOT NULL,
  `team` varchar(3) DEFAULT NULL,
  `position` varchar(3) DEFAULT NULL,
  `draftPosition` int NOT NULL,
  `teamId` int NOT NULL,
  `source` enum('nfl','sleeper') NOT NULL DEFAULT 'nfl',
  PRIMARY KEY (`id`),
  KEY `draftTeamId_idx` (`teamId`),
  CONSTRAINT `draftTeamId` FOREIGN KEY (`teamId`) REFERENCES `teams` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2251 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `leaguesettings`
--

DROP TABLE IF EXISTS `leaguesettings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leaguesettings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `year` int NOT NULL,
  `numWeeksRegular` int NOT NULL,
  `numWeeksPlayoffs` int NOT NULL,
  `numTeams` int NOT NULL,
  `numTeamsPlayoffs` int NOT NULL,
  `source` enum('nfl','sleeper') NOT NULL DEFAULT 'nfl',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `leaguesettingspositions`;
--

DROP TABLE IF EXISTS `leaguesettingspositions`;
CREATE TABLE `leaguesettingspositions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `year` int NOT NULL,
  `rosterPositionId` int NOT NULL,
  `numSlots` int NOT NULL,
  PRIMARY KEY(`id`),
  CONSTRAINT `rosterPosition` FOREIGN KEY (`rosterPositionId`) REFERENCES `rosterpositions` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `matchups`
--

DROP TABLE IF EXISTS `matchups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `matchups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `teamId` int NOT NULL,
  `opponentId` int DEFAULT NULL,
  `week` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `teamId_idx` (`teamId`),
  KEY `opponentId_idx` (`opponentId`),
  CONSTRAINT `matchupOpponentId` FOREIGN KEY (`opponentId`) REFERENCES `teams` (`id`),
  CONSTRAINT `matchupTeamId` FOREIGN KEY (`teamId`) REFERENCES `teams` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2345 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rosterpositions`
--

DROP TABLE IF EXISTS `rosterpositions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rosterpositions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `position` varchar(45) DEFAULT NULL,
  `order` int NULL
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sleeperplayers`
--

DROP TABLE IF EXISTS `sleeperplayers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sleeperplayers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(1000) NOT NULL,
  `team` varchar(3) DEFAULT NULL,
  `rosterPositionId` int NOT NULL,
  `lastUpdated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sleeperId` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `rosterPositionId_idx` (`rosterPositionId`),
  CONSTRAINT `rosterPositionId` FOREIGN KEY (`rosterPositionId`) REFERENCES `rosterpositions` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3937 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `teams`
--

DROP TABLE IF EXISTS `teams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teams` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `year` int DEFAULT NULL,
  `userId` int NOT NULL,
  `nflId` int DEFAULT NULL,
  `sleeperId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `userId_idx` (`userId`),
  CONSTRAINT `userId` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=155 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tradeplayers`
--

DROP TABLE IF EXISTS `tradeplayers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tradeplayers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tradeId` int NOT NULL,
  `originalTeamId` int NOT NULL,
  `newTeamId` int DEFAULT NULL,
  `name` varchar(1000) DEFAULT NULL,
  `team` varchar(3) DEFAULT NULL,
  `position` varchar(3) DEFAULT NULL,
  `source` enum('nfl','sleeper') NOT NULL DEFAULT 'nfl',
  PRIMARY KEY (`id`),
  KEY `originalTeam_idx` (`originalTeamId`),
  KEY `newTeam_idx` (`newTeamId`),
  CONSTRAINT `newTeam` FOREIGN KEY (`newTeamId`) REFERENCES `teams` (`id`),
  CONSTRAINT `originalTeam` FOREIGN KEY (`originalTeamId`) REFERENCES `teams` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=289 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trades`
--

DROP TABLE IF EXISTS `trades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trades` (
  `id` int NOT NULL AUTO_INCREMENT,
  `team1` int NOT NULL,
  `team2` int NOT NULL,
  `vetoed` tinyint NOT NULL,
  `year` int NOT NULL,
  `source` enum('nfl','sleeper') NOT NULL DEFAULT 'nfl',
  PRIMARY KEY (`id`),
  KEY `tradeTeam1_idx` (`team1`),
  KEY `tradeTeam2_idx` (`team2`),
  CONSTRAINT `tradeTeam1` FOREIGN KEY (`team1`) REFERENCES `teams` (`id`),
  CONSTRAINT `tradeTeam2` FOREIGN KEY (`team2`) REFERENCES `teams` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=91 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `weeklyplayerstats`
--

DROP TABLE IF EXISTS `weeklyplayerstats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `weeklyplayerstats` (
  `id` int NOT NULL AUTO_INCREMENT,
  `teamId` int NOT NULL,
  `week` int NOT NULL,
  `name` varchar(1000) DEFAULT NULL,
  `team` varchar(3) DEFAULT NULL,
  `opponent` varchar(4) DEFAULT NULL,
  `playerPosition` varchar(3) DEFAULT NULL,
  `rosterPositionId` int NOT NULL,
  `passingYards` int DEFAULT NULL,
  `passingTds` int DEFAULT NULL,
  `passingInts` int DEFAULT NULL,
  `rushingYards` int DEFAULT NULL,
  `rushingTds` int DEFAULT NULL,
  `receivingYards` int DEFAULT NULL,
  `receivingTds` int DEFAULT NULL,
  `fumbles` int DEFAULT NULL,
  `twoPoints` int DEFAULT NULL,
  `pats` int DEFAULT NULL,
  `nineteenFgs` int DEFAULT NULL,
  `twentynineFgs` int DEFAULT NULL,
  `thirtynineFgs` int DEFAULT NULL,
  `fourtynineFgs` int DEFAULT NULL,
  `fiftyFgs` int DEFAULT NULL,
  `sacks` int DEFAULT NULL,
  `defenseInts` int DEFAULT NULL,
  `fumbleRecoveries` int DEFAULT NULL,
  `safeties` int DEFAULT NULL,
  `defenseTds` int DEFAULT NULL,
  `returnTds` int DEFAULT NULL,
  `pointsAllowed` int DEFAULT NULL,
  `totalPoints` float DEFAULT NULL,
  `gameUrl` varchar(1000) DEFAULT NULL,
  `source` enum('nfl','sleeper') NOT NULL DEFAULT 'nfl',
  PRIMARY KEY (`id`),
  KEY `teamId_idx` (`teamId`),
  KEY `positionId_idx` (`rosterPositionId`),
  CONSTRAINT `positionId` FOREIGN KEY (`rosterPositionId`) REFERENCES `rosterpositions` (`id`),
  CONSTRAINT `teamId` FOREIGN KEY (`teamId`) REFERENCES `teams` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=36502 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-26 22:16:33
