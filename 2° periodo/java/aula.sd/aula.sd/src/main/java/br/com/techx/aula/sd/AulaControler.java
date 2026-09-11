package br.com.techx.aula.sd;

import br.com.techx.aula.model.Aluno;
import lombok.Data;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
@Data
@RestController
@RequestMapping("/aula")
public class AulaControler {
    Aluno aluno = new Aluno("Jose", 19, 101459);

    @GetMapping("/nome")
    public String getNome() {
        return aluno.getNome();
    }

    @GetMapping("/idade")
    public int getIdade() {
        return aluno.getIdade();
    }

    @GetMapping("/ra")
    public int getRa() {
        return aluno.getRa();
    }

    @GetMapping
    public Aluno getAluno() {
        return aluno;
    }
}

