
export const getElapsedTime = (startTimestamp: number): string => {
    const now = new Date();
    const startTime = new Date(startTimestamp);
    if (startTime !== null) {
      // strip milliseconds
      let timeDiff = (now.getTime() - startTime.getTime()) / 1000;
      //var timeStr = timeDiff.toTimeString().split(' ')[0];
      const seconds = Math.round(timeDiff % 60);
      timeDiff = Math.floor(timeDiff / 60);
      var minutes = Math.round(timeDiff % 60);
      timeDiff = Math.floor(timeDiff / 60);
      var hours = Math.round(timeDiff % 24);
      const timestr = `${hours}h ${minutes}m`;
      return timestr;
    } else {
      return "0h 0m";
    }
  };