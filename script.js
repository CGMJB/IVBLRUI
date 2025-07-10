import csv
import argparse

def process_csv(input_file, output_file):
    """
    处理CSV文件，计算积分和净胜值
    
    参数:
        input_file (str): 输入CSV文件路径
        output_file (str): 输出CSV文件路径
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
        with open(input_file, 'r', newline='', encoding='utf-8') as infile, \
             open(output_file, 'w', newline='', encoding='utf-8') as outfile:
            
            reader = csv.reader(infile)
            writer = csv.writer(outfile)
            
            # 读取标题行
            headers = next(reader)
            
            # 添加新列标题
            new_headers = [
                headers[C_INDEX], 
                headers[D_INDEX],
                "积分A",
                "净胜A",
                "积分B",
                "净胜B"
            ]
            writer.writerow(new_headers)
            
            # 处理每一行数据
            for row in reader:
                # 提取原始C列和D列数据
                c_val = row[C_INDEX]
                d_val = row[D_INDEX]
                
                # 提取其他列并转换为数值
                try:
                    m = float(row[M_INDEX])
                    n = float(row[N_INDEX])
                    o = float(row[O_INDEX])
                    p = float(row[P_INDEX])
                    q = row[Q_INDEX].strip()
                    r = float(row[R_INDEX])
                    s = float(row[S_INDEX])
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
                
                # 写入结果
                writer.writerow([
                    c_val,
                    d_val,
                    score_a,
                    net_a,
                    score_b,
                    net_b
                ])
        
        print(f"处理完成！结果已保存至 {output_file}")
    
    except Exception as e:
        print(f"处理过程中出错: {str(e)}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CSV文件积分计算工具")
    parser.add_argument("input", help="输入CSV文件路径")
    parser.add_argument("output", help="输出CSV文件路径")
    
    args = parser.parse_args()
    process_csv(args.input, args.output)
