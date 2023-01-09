import React, {
  useState,
  useEffect,
  useMemo
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


/**
 * Data Processing:
 * allData - conditional check to make sure all the necessary data has been received from Sigma
 * arraySorter - sorts the input columns by ascending date order
 * getData - creates the data series for Highcharts and returns the required data object
*/

const allData = (config, sigmaData) => {
  if (!sigmaData[config['open']] 
  && !sigmaData[config['high']] 
  && !sigmaData[config['low']] 
  && !sigmaData[config['close']] 
  && !sigmaData[config['date']] 
  && !sigmaData[config['volume']] 
  && !sigmaData[config['symbol']]) {
    return false;
  }
  return true;
}


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

  // Create temp array
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

  // Sort the array by the date value in each object
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

  // Return the sigmaData object, now with all of the input columns sorted in ascending 
  // orer by date
  return sigmaData;
}

const getData = (config, sigmaData) => {

  // Conditional to see if we have the config and element data from Sigma.
  // If we have both, proceed with creating the output object
  if (allData(config, sigmaData)) {
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

    // Create the output object for the candlestick chart
    return {
      chart: {
        animation: false,
        type: 'candlestick'
      },
      rangeSelector: {
        enabled: true,
        animation: false
      },
      navigator: {
        enabled: true
      },
      scrollbar: {
        enabled: true,
      },
      series: [{
        step: 'center',
        name: sigmaData[config['symbol']][0],
        data: series,
        type: "candlestick"
      }] 
    }
  } 
}


/** 
 *Main Function Wrapper 
*/

const useMain = () => {
  // Connect to Sigma
  const config = useConfig();
  const sigmaData = useElementData(config.source);
  
  // Process the data from Sigma and memoize result
  const payload = useMemo(() => getData(config, sigmaData), [config, sigmaData]);

  const [res, setRes] = useState(null);

  // call useEffect hook to re-render when the payload has changed depending on input data
  useEffect(() => {
    setRes(payload);  
  }, [payload])

  return res;
}

const App = () => {
  const options = useMain();
  return (
    options && <HighchartsReact highcharts={Highcharts} constructorType={"stockChart"} options={options} />
  );
}

export default App;