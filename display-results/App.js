import React, { useState, useEffect, useRef } from 'react';
import ReactApexChart from 'react-apexcharts';


const QuadrantChart = ({ data, label, color, yAxisMin, yAxisMax }) => {
  const chartOptions = {
    chart: {
      type: 'area',
      stacked: false,
      animations: {
        enabled: true,
        easing: 'linear',
        dynamicAnimation: {
          speed: 1000,
        },
      },
      background: '#FFFFFF', // Set chart background color to white
    },
    xaxis: {
      type: 'datetime',
      labels: {
        datetimeUTC: false,
      },
    },
    yaxis: {
      min: yAxisMin,
      max: yAxisMax,
      labels: {
        formatter: function (value) {
          return value.toFixed(1);
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth',
      width: 2,
      colors: [color],
    },
    fill: {
      colors: ['#008080'], // Light teal color for the area chart
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        inverseColors: false,
        opacityFrom: 0.7,
        opacityTo: 0.2,
        stops: [0, 100],
      },
    },
    toolbar: {}, // Remove the toolbar buttons
  };

  const chartSeries = [
    {
      name: label,
      data: data.map(entry => [new Date(entry.timestamp).getTime(), entry.value]),
    },
  ];

  return <ReactApexChart options={chartOptions} series={chartSeries} type="area" height="350" />;
};

const App = () => {
  const [downloadSpeedData, setDownloadSpeedData] = useState([]);
  const [uploadSpeedData, setUploadSpeedData] = useState([]);
  const [jitterData, setJitterData] = useState([]);
  const [pingData, setPingData] = useState([]);
  const [collectionName, setCollectionName] = useState(""); // State to store collectionName
  const [totalDropoutsLast24Hours, setTotalDropoutsLast24Hours] = useState(0); // State for totalDropoutsLast24Hours
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const [latestTestResults, setLatestTestResults] = useState({
    downloadSpeed: null,
    uploadSpeed: null,
    ping: null,
  });
  useEffect(() => {
    console.log("Effect 1 triggered");

    // Add the event listener for receiving collection name
    const listener = (event) => {
      if (event.data.type === "speedTestData") {
        console.log("Received collection name:", event.data.collectionName);
        console.log("Received totalDropoutsLast24Hours:", event.data.totalDropoutsLast24Hours);

        // Set the collectionName and totalDropoutsLast24Hours in the state
        setCollectionName(event.data.collectionName);
        setTotalDropoutsLast24Hours(event.data.totalDropoutsLast24Hours);
      }
    };

    window.addEventListener("message", listener);

    // Clean up the event listener when the component is unmounted
    return () => {
      window.removeEventListener("message", listener);
    };
  }, []); // Empty dependency array ensures the effect runs only once

  useEffect(() => {
    console.log("Effect 2 triggered");

    const fetchData = async () => {
      try {
        console.log("Fetching data for collection:", collectionName);
        console.log("Checking collectionName:", collectionName);
        if (collectionName) {
          const response = await fetch(
            `https://us-central1-thewirednomad.cloudfunctions.net/fetchSpeedTests?collection=${collectionName}`
          );

          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }

          const results = await response.json();
          console.log("Fetched data:", results);

          // Calculate the date threshold (e.g., 7 days ago from the latest date)
          const today = new Date();
          const latestDate = new Date(Math.max(...results.map((entry) => new Date(entry.timestamp))));
          const thresholdDate = new Date(latestDate);
          thresholdDate.setDate(thresholdDate.getDate() - 7); // Change 7 to the desired number of days

          // Filter the results to keep only data newer than the threshold date
          const filteredResults = results.filter((entry) => new Date(entry.timestamp) >= thresholdDate);

          // Split the filtered data into separate arrays for each metric
          const newDownloadSpeedData = filteredResults.map((entry) => ({
            timestamp: entry.timestamp,
            value: entry.downloadSpeed,
          }));
          const newUploadSpeedData = filteredResults.map((entry) => ({
            timestamp: entry.timestamp,
            value: entry.uploadSpeed,
          }));
          const newJitterData = filteredResults.map((entry) => ({
            timestamp: entry.timestamp,
            value: entry.jitterSpeed,
          }));
          const newPingData = filteredResults.map((entry) => ({
            timestamp: entry.timestamp,
            value: entry.pingSpeed,
          }));

          // Use functional updates for state to ensure correctness
          setDownloadSpeedData((prevData) => [...prevData, ...newDownloadSpeedData]);
          setUploadSpeedData((prevData) => [...prevData, ...newUploadSpeedData]);
          setJitterData((prevData) => [...prevData, ...newJitterData]);
          setPingData((prevData) => [...prevData, ...newPingData]);
        }
      } catch (error) {
        console.error("Error fetching speed tests:", error);
      } finally {
        // Set loading to false regardless of success or failure
        setIsLoading(false);
      }
    };

    fetchData();
  }, [collectionName]); // Run the effect whenever collectionName changes

  useEffect(() => {
    console.log("Effect 3 triggered");

    // Fetch the latest test results
    const fetchLatestTestResults = async () => {
      try {
        const response = await fetch(
          `https://us-central1-thewirednomad.cloudfunctions.net/fetchLatestTestResults?collection=${collectionName}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const latestResults = await response.json();
        console.log("Fetched latest test results:", latestResults);

        setLatestTestResults(latestResults);
      } catch (error) {
        console.error("Error fetching latest test results:", error);
      }
    };

    fetchLatestTestResults();
  }, [collectionName]); // Run the effect whenever collectionName changes

  const chartConfigurations = [
    { label: 'Download Speed (Mbps)', data: downloadSpeedData, color: '#008080' },
    { label: 'Upload Speed (Mbps)', data: uploadSpeedData, color: '#008080' },
    { label: 'Jitter (ms)', data: jitterData, color: '#008080', yAxisMin: 0, yAxisMax: 50 },
    { label: 'Latency (ms)', data: pingData, color: '#008080', yAxisMin: 0, yAxisMax: 200 },
  ];

  return (
    <div style={{ backgroundColor: '#003651', minHeight: '100vh', padding: '20px', boxSizing: 'border-box', position: 'relative' }}>
      {/* Add the latest test results section */}
      <div style={{ color: '#FFFFFF', fontSize: '20px', marginBottom: '20px', textAlign: 'center' }}>
        Dropouts in last 24 hours: {totalDropoutsLast24Hours}
        <br />
        Latest test results:
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
          {/* Download Speed */}
          <div style={{ marginRight: '20px' }}>
            <p style={{ fontSize: '16px', marginBottom: '5px' }}>Download Speed (Mbps)</p>
            <div style={{ border: '1px solid #FFFFFF', borderRadius: '8px', padding: '10px' }}>{latestTestResults.downloadSpeed !== null ? latestTestResults.downloadSpeed.toFixed(2) : 'Loading...'}</div>
          </div>
          {/* Upload Speed */}
          <div style={{ marginRight: '20px' }}>
            <p style={{ fontSize: '16px', marginBottom: '5px' }}>Upload Speed (Mbps)</p>
            <div style={{ border: '1px solid #FFFFFF', borderRadius: '8px', padding: '10px' }}>{latestTestResults.uploadSpeed !== null ? latestTestResults.uploadSpeed.toFixed(2) : 'Loading...'}</div>
          </div>
          {/* Ping */}
          <div>
            <p style={{ fontSize: '16px', marginBottom: '5px' }}>Ping (ms)</p>
            <div style={{ border: '1px solid #FFFFFF', borderRadius: '8px', padding: '10px' }}>
              {latestTestResults && typeof latestTestResults.pingSpeed === 'number' ? latestTestResults.pingSpeed.toFixed(2) : 'Loading...'}
            </div>
          </div>
        </div>
      </div>
      {/* Add the latest 14 days data section */}
      <div style={{ color: '#FFFFFF', fontSize: '16px', marginBottom: '20px', textAlign: 'center' }}>
        Last 14 days data:
      </div>
      {/* Add the chart configurations section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '20px' }}>
        {chartConfigurations.map(({ label, data, color, yAxisMin, yAxisMax }) => (
          <div key={label} style={{ width: '90%', height: '90%', backgroundColor: '#003651', padding: '20px', borderRadius: '8px', color: '#FFFFFF' }}>
            <h2>{label}</h2>
            {isLoading ? <p>Loading...</p> : <QuadrantChart data={data} label={label} color={color} yAxisMin={yAxisMin} yAxisMax={yAxisMax} />}
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
