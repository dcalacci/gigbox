import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { View, Text } from "react-native";

import { tailwind } from "tailwind";
import { RootState } from "../store/index";
import { Employers } from "../features/clock/clockSlice";

type EmployerBoxProps = {
  employer: Employers;
};

type EmployerBoxesProps = {
  hidden: boolean;
};

export const EmployerBox: React.FC<EmployerBoxProps> = ({ employer }) => {
  return (
    <View style={tailwind("h-20 w-20 border-opacity-100 border-black")}>
      <Text style={tailwind("self-center")}>{employer}</Text>
    </View>
  );
};

const EmployerBoxes: React.FC<EmployerBoxesProps> = ({ hidden }) => {
  const activeEmployers = useSelector(
    (state: RootState): Employers[] => {
      if (state.clock.shift.employers)
        return state.clock.shift.employers
      else
        return []
    }
  );

  return (
    <View style={[tailwind("flex-row justify-around content-center bg-green-400"),
    hidden ? tailwind("hidden") : null]}>
      {activeEmployers.map((e) => (
        <EmployerBox employer={e} key={e}></EmployerBox>
      ))}
  </View>
  );
};

export default EmployerBoxes;
