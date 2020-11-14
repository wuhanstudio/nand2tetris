def parse(line):
    line = line.strip()

    if line.startswith("//") or line == "":     # comment line or empty line
        pass                                    # return None
    else:
        return line.split(" ")                  # returns array - ["push", "local", "3"]