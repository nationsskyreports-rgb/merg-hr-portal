import { View, ActivityIndicator, Button, Text, Platform } from "react-native";
import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import * as Location from "expo-location";

// ✅ Import الماب بس على الموبايل
let MapView, Marker, Circle;
if (Platform.OS !== "web") {
  MapView = require("react-native-maps").default;
  Marker = require("react-native-maps").Marker;
  Circle = require("react-native-maps").Circle;
}

export default function MyLocationScreen({ goBack }) {
  const [office, setOffice] = useState(null);
  const [userLoc, setUserLoc] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("office_location")
        .select("*")
        .eq("is_active", true)
        .single();

      setOffice(data);

      // ✅ الـ GPS بيشتغل على الموبايل بس
      if (Platform.OS !== "web") {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        let loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        setUserLoc({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      }
    })();
  }, []);

  if (!office || (Platform.OS !== "web" && !userLoc)) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 20 }}>Loading map…</Text>
        <Button title="Back" onPress={goBack} />
      </View>
    );
  }

  // ✅ على الويب بيفتح Google Maps في iframe
  if (Platform.OS === "web") {
    const mapsUrl = `https://maps.google.com/maps?q=${office.latitude},${office.longitude}&z=16&output=embed`;
    return (
      <View style={{ flex: 1 }}>
        <Text style={{ padding: 10, textAlign: "center", fontWeight: "bold" }}>
          📍 موقع المكتب
        </Text>
        <iframe
          src={mapsUrl}
          style={{ flex: 1, width: "100%", height: "100%", border: "none" }}
          allowFullScreen
        />
        <Button title="Back" onPress={goBack} />
      </View>
    );
  }

  // ✅ على الموبايل بيشتغل عادي زي الأول
  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: office.latitude,
          longitude: office.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker
          coordinate={{ latitude: office.latitude, longitude: office.longitude }}
          title="Office"
        />
        <Circle
          center={{ latitude: office.latitude, longitude: office.longitude }}
          radius={office.radius_meters}
          strokeColor="rgba(0,122,255,0.7)"
          fillColor="rgba(0,122,255,0.2)"
        />
        <Marker coordinate={userLoc} pinColor="green" title="You" />
      </MapView>
      <Button title="Back" onPress={goBack} />
    </View>
  );
}