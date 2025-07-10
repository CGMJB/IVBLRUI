import csv
import argparse
import pandas as pd
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, Border, Side, PatternFill
from openpyxl.utils import get_column_letter

def process_csv(input_file, output_file):
    """
    处理CSV文件，计算积分和净胜值，并生成带排名的Excel文件
    
    参数:
        input_file (str): 输入CSV文件路径
        output_file (str): 输出Excel文件路径
    """
    # 定义列索引（0-based）
    C_INDEX = 2    # C列
    D_INDEX = 3    # D列
    M_INDEX = 12   # M列
    N_INDEX = 13   # N列
    O_INDEX = 14   # O列
    P_INDEX = 15   # P列
    Q_INDEX = 16   # Q列
    R_INDEX = 17   # R列
    S_INDEX = 18   # S列
    
    try:
        # 读取CSV并处理
        with open(input_file, 'r', newline='', encoding='utf-8') as infile:
            reader = csv.reader(infile)
            headers = next(reader)
            
            # 准备数据收集
            detailed_data = []
            team_stats = {}
            
            # 处理每一行数据
            for row in reader:
                # 提取原始C列和D列数据
                c_val = row[C_INDEX]
                d_val = row[D_INDEX]
                
                # 提取其他列并转换为数值
                try:
                    m = float(row[M_INDEX]) if row[M_INDEX] else 0.0
                    n = float(row[N_INDEX]) if row[N_INDEX] else 0.0
                    o = float(row[O_INDEX]) if row[O_INDEX] else 0.0
                    p = float(row[P_INDEX]) if row[P_INDEX] else 0.0
                    q = row[Q_INDEX].strip() if Q_INDEX < len(row) else ""
                    r = float(row[R_INDEX]) if row[R_INDEX] else 0.0
                    s = float(row[S_INDEX]) if row[S_INDEX] else 0.0
                except (ValueError, IndexError) as e:
                    print(f"行 {reader.line_num}: 数据转换错误 - {str(e)}")
                    continue
                
                # 初始化结果
                score_a = 0
                score_b = 0
                net_a = 0
                net_b = 0
                
                # 规则1: 比较M和N
                if m != n:
                    if m > n:
                        score_a = 1
                        net_a = m - n
                        net_b = -(m - n)
                    else:
                        score_b = 1
                        net_b = n - m
                        net_a = -(n - m)
                
                # 规则2: M等于N时比较O和P
                elif o != p:
                    if o > p:
                        score_a = 1
                    else:
                        score_b = 1
                    # 净胜值保持为0
                
                # 规则3: O等于P时处理Q,R,S
                else:
                    if q == "四抓":
                        # 四抓规则: 小的一方得1分
                        if r < s:
                            score_a = 1
                        elif r > s:
                            score_b = 1
                    else:
                        # 非四抓规则: 大的一方得1分
                        if r > s:
                            score_a = 1
                        elif r < s:
                            score_b = 1
                    # 净胜值保持为0
                
                # 收集详细数据
                detailed_data.append([
                    c_val,
                    d_val,
                    score_a,
                    net_a,
                    score_b,
                    net_b
                ])
                
                # 更新队伍统计（A队）
                if c_val not in team_stats:
                    team_stats[c_val] = {"score": 0, "net": 0, "games": 0}
                team_stats[c_val]["score"] += score_a
                team_stats[c_val]["net"] += net_a
                team_stats[c_val]["games"] += 1
                
                # 更新队伍统计（B队）
                if d_val not in team_stats:
                    team_stats[d_val] = {"score": 0, "net": 0, "games": 0}
                team_stats[d_val]["score"] += score_b
                team_stats[d_val]["net"] += net_b
                team_stats[d_val]["games"] += 1
        
        # 创建Excel工作簿
        wb = Workbook()
        
        # 创建详细数据工作表
        ws_detail = wb.active
        ws_detail.title = "详细数据"
        
        # 添加详细数据标题
        detail_headers = [
            headers[C_INDEX], 
            headers[D_INDEX],
            "积分A",
            "净胜A",
            "积分B",
            "净胜B"
        ]
        ws_detail.append(detail_headers)
        
        # 添加详细数据
        for row in detailed_data:
            ws_detail.append(row)
        
        # 创建排名工作表
        ws_ranking = wb.create_sheet(title="队伍排名")
        
        # 添加排名标题
        ranking_headers = [
            "排名",
            "队伍名称",
            "总积分",
            "总净胜分",
            "参赛场次"
        ]
        ws_ranking.append(ranking_headers)
        
        # 准备排名数据
        ranking_data = []
        for team, stats in team_stats.items():
            ranking_data.append([
                team,
                stats["score"],
                stats["net"],
                stats["games"]
            ])
        
        # 按积分和净胜分排序（积分优先，然后净胜分）
        ranking_data.sort(key=lambda x: (-x[1], -x[2]))
        
        # 添加排名并分配名次
        rank = 1
        prev_score = None
        prev_net = None
        for i, data in enumerate(ranking_data):
            team, score, net, games = data
            
            # 处理并列排名
            if prev_score == score and prev_net == net:
                current_rank = f"T-{rank}"
            else:
                current_rank = rank
                rank = i + 1  # 更新基础排名
            
            ws_ranking.append([
                current_rank,
                team,
                score,
                net,
                games
            ])
            
            prev_score = score
            prev_net = net
        
        # 美化Excel格式
        style_excel(wb)
        
        # 保存Excel文件
        wb.save(output_file)
        print(f"处理完成！结果已保存至 {output_file}")
    
    except Exception as e:
        print(f"处理过程中出错: {str(e)}")
        import traceback
        traceback.print_exc()

def style_excel(wb):
    """美化Excel工作簿格式"""
    # 设置字体和边框
    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="4F81BD", end_color="4F81BD", fill_type="solid")
    header_alignment = Alignment(horizontal="center", vertical="center")
    thin_border = Border(
        left=Side(style='thin'), 
        right=Side(style='thin'), 
        top=Side(style='thin'), 
        bottom=Side(style='thin')
    )
    
    for sheet in wb:
        # 设置列宽
        for col_idx, column in enumerate(sheet.columns, 1):
            max_length = 0
            column = [cell for cell in column]
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(cell.value)
                except:
                    pass
            adjusted_width = (max_length + 2) * 1.2
            sheet.column_dimensions[get_column_letter(col_idx)].width = adjusted_width
        
        # 设置标题行样式
        for cell in sheet[1]:
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = header_alignment
            cell.border = thin_border
        
        # 设置数据行样式
        for row in sheet.iter_rows(min_row=2):
            for cell in row:
                cell.border = thin_border
                
                # 数值列右对齐
                if isinstance(cell.value, (int, float)):
                    cell.alignment = Alignment(horizontal="right")
                else:
                    cell.alignment = Alignment(horizontal="left")
        
        # 冻结标题行
        sheet.freeze_panes = "A2"

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CSV文件积分计算与排名工具")
    parser.add_argument("input", help="输入CSV文件路径")
    parser.add_argument("output", help="输出Excel文件路径(.xlsx)")
    
    args = parser.parse_args()
    process_csv(args.input, args.output)
