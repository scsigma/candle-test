import React, {
  useState,
  useEffect
} from 'react';

// Sigma Packages
import { client, useConfig, useElementData } from '@sigmacomputing/plugin';

// Highcharts Packages
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';

// -------------------------------------------------------

// Set up Sigma Client Config
client.config.configureEditorPanel([
  { name: "source", type: "element"},
  { name: "open", type: "column", source: "source", allowMultiple: false},
  { name: "high", type: "column", source: "source", allowMultiple: false},
  { name: "low", type: "column", source: "source", allowMultiple: false},
  { name: "close", type: "column", source: "source", allowMultiple: false},
  { name: "date", type: "column", source: "source", allowMultiple: false},
  { name: "volume", type: "column", source: "source", allowMultiple: false},
  { name: "symbol", type: "column", source: "source", allowMultiple: false}
]);


// Data Processor for the dates
const arraySorter = (config, sigmaData) => {
  
  // Destructure config object
  const {
    open,
    high,
    low,
    close,
    date,
    volume,
    symbol,
  } = config;

  // Create array
  let list = [];

  // Loop through the length of the arrays, push objects to temp array consisting
  // of the values at each step
  for (let i = 0; i < sigmaData[open].length; i++) {
    list.push({
      open: sigmaData[open][i],
      high: sigmaData[high][i],
      low: sigmaData[low][i],
      close: sigmaData[close][i],
      date: sigmaData[date][i],
      volume: sigmaData[volume][i],
      symbol: sigmaData[symbol][i]
    });
  }

  // Becuase this is an array of objects, sort by the date in each object
  list.sort((a, b) => a.date - b.date);

  // Separate the values in the objects and assign them back to their original arrays
  for (let i = 0; i < list.length; i++) {
    sigmaData[open][i] = list[i].open;
    sigmaData[high][i] = list[i].high;
    sigmaData[low][i] = list[i].low;
    sigmaData[close][i] = list[i].close;
    sigmaData[date][i] = list[i].date;
    sigmaData[volume][i] = list[i].volume;
    sigmaData[symbol][i] = list[i].symbol;
  }

  console.log('new sigmaData', sigmaData);
  return sigmaData;
}

// Data Processing
const getData = (config, sigmaData) => {

  // Sort the data by date
  sigmaData = arraySorter(config, sigmaData);

  // Create the series array in the format: date, open, high, low, close
  const series = sigmaData[config['date']].map((val, i) => {
    return [
      val, 
      sigmaData[config['open']][i], 
      sigmaData[config['high']][i], 
      sigmaData[config['low']][i], 
      sigmaData[config['close']][i]
    ]
  })

  console.log('series', series);
  // Create the output object for the candlestick chart
  return {
    // rangeSelector: {
    //   selected: 1
    // },
    chart: {
      animation: true,
      type: 'candlestick'
    },
    navigator: {
      enabled: true
    },
    scrollbar: {
      enabled: true,
    },
    // xAxis: {
    //   scrollablePlotArea: {
    //     maxWidth: 1,
    //   },
    //   zoomEnabled: true,
    //   width: "100%",
    //   range: 10000,
    //   units: [["hour", [1]]],
    // },
    // yAxis: {
    //   title: {
    //     text: "PRICE",
    //     margin: -20,
    //     style: {
    //       color: "white",
    //       fontWeight: 800,
    //       opacity: 0.7,
    //     },
    //   },
    // },
    series: [{
      step: 'center',
      name: sigmaData[config['symbol']][0],
      data: series,
      type: "candlestick"
    }] 
  }
}

// All Data Conditional
const allData = (config, sigmaData) => {
  if (!sigmaData[config['open']] 
  && !sigmaData[config['high']] 
  && !sigmaData[config['low']] 
  && !sigmaData[config['close']] 
  && !sigmaData[config['date']] 
  && !sigmaData[config['volume']] 
  && !sigmaData[config['symbol']]) {
    console.log('data isnt here yet');
    return false;
  }
  console.log('all data here');
  return true;
}

// Main Function
const useMain = () => {
  const config = useConfig();
  const sigmaData = useElementData(config.source);
  console.log('config', config);
  console.log('sigmaData', sigmaData);

  const [res, setRes] = useState(null);

  useEffect(() => {
    
    // Call conditional function to make sure all data is in (async operation)
    if (allData(config, sigmaData)) {
      setRes(getData(config, sigmaData));
    }

  }, [config, sigmaData])

  console.log('RES', res);
  return res;
}

const App = () => {
  const options = useMain();
  return (
    options && <HighchartsReact highcharts={Highcharts} constructorType={"stockChart"} options={options} />
  );
}

export default App;