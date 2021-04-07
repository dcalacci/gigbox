// component to allow user to select employers they're working for
// on a particular shift.
import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";

import { tailwind } from "tailwind";

enum Employers {
    INSTACART="Instacart",
    DOORDASH="DoorDash",
    SHIPT="Shipt",
    GRUBHUB="GrubHub",
    UBEREATS="UBEREATS"
}

type EmployerBoxProps = {
  employer: Employers;
};

type EmployerBoxesProps = {
  hidden: boolean;
  employers: Employers[]
};

const EmployerBox: React.FC<EmployerBoxProps> = ({ employer }) => {
  return (
    <View style={tailwind("h-20 w-20 border-opacity-100 border-black")}>
      <Text style={tailwind("self-center")}>{employer}</Text>
    </View>
  );
};

const EmployerBoxes: React.FC<EmployerBoxesProps> = ({ hidden, employers}) => {
  return (
    <View style={[tailwind("flex-row justify-around content-center bg-green-400"),
    hidden ? tailwind("hidden") : null]}>
      {employers.map((e) => (
        <EmployerBox employer={e} key={e}></EmployerBox>
      ))}
    </View>
  );
};

export default EmployerBoxes;
