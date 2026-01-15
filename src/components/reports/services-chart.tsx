"use client"

import { Pie, PieChart, Sector } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import * as React from "react"
import { TrendingUp } from "lucide-react"

const chartData = [
  { service: "Khám bệnh", usage: 275, fill: "var(--color-kham)" },
  { service: "Tiêm phòng", usage: 200, fill: "var(--color-tiem)" },
  { service: "Spa & Grooming", usage: 187, fill: "var(--color-spa)" },
  { service: "Phẫu thuật", usage: 173, fill: "var(--color-phau-thuat)" },
  { service: "Xét nghiệm", usage: 90, fill: "var(--color-xet-nghiem)" },
]

const chartConfig = {
  usage: {
    label: "Lượt sử dụng",
  },
  kham: {
    label: "Khám bệnh",
    color: "hsl(var(--chart-1))",
  },
  tiem: {
    label: "Tiêm phòng",
    color: "hsl(var(--chart-2))",
  },
  spa: {
    label: "Spa & Grooming",
    color: "hsl(var(--chart-3))",
  },
  "phau-thuat": {
    label: "Phẫu thuật",
    color: "hsl(var(--chart-4))",
  },
  "xet-nghiem": {
    label: "Xét nghiệm",
    color: "hsl(var(--chart-5))",
  },
} 

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="font-bold text-lg">
        {payload.service}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
       <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" className="text-sm">{`${value} lượt`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" className="text-xs">
        {`(Rate ${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};


export function ServicesChart() {
    const [activeIndex, setActiveIndex] = React.useState(0);
    const onPieEnter = React.useCallback(
        (_: any, index: number) => {
            setActiveIndex(index);
        },
        [setActiveIndex]
    );

  return (
      <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square max-h-[300px]"
      >
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            dataKey="usage"
            onMouseEnter={onPieEnter}
          />
        </PieChart>
      </ChartContainer>
  )
}
