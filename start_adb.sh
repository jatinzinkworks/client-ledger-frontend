#!/usr/bin/bash

echo $ADB

$ADB reverse tcp:8081 tcp:8081   # Expo, to download the app
$ADB reverse tcp:8080 tcp:8080   # the backend
