import requests

try:
    url = "http://127.0.0.1:8000/api/shops/nearby"
    params = {
        "lng": 105.8542,
        "lat": 21.0285,
        "radius_km": 5.0
    }
    print("Sending GET request to:", url)
    response = requests.get(url, params=params)
    print("Status Code:", response.status_code)
    try:
        print("Response JSON:", response.json())
    except:
        print("Response Text:", response.text)
except Exception as e:
    print("Error calling API:", e)
