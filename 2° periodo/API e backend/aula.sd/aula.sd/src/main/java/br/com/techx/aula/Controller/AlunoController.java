package br.com.techx.aula.Controller;

import br.com.techx.aula.Dto.AlunoResponse;
import br.com.techx.aula.Model.Aluno;
import br.com.techx.aula.Service.AlunoService;
import br.com.techx.aula.Dto.AlunoRequest;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@Data
@RestController
@RequestMapping("/aluno")
public class AlunoController {
    Aluno aluno = new Aluno(123,"Jose", 19, 101459);

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

    @GetMapping("/frase")
    private String SistemaFrase() {
        return("o ra do aluno " + aluno.getNome() + " é " + aluno.getRa());
    }

//    @GetMapping
//    public Aluno getAluno() {
//        return aluno;
//    }
    @Autowired
    private AlunoService alunoService;
    @GetMapping
    public List<Aluno> getAll() {
        return alunoService.buscar();
    }
    @PostMapping
    public void create(@RequestBody AlunoRequest alunoRequest) {
        alunoService.create(alunoRequest);
    }
    @GetMapping("/{id}")
    public AlunoResponse getById(@PathVariable long id) {
        return alunoService.findById(id);
    }
    @PutMapping("/{id}")
    public void update(@PathVariable long id,@RequestBody AlunoRequest alunoRequest) {
        alunoService.update(id, alunoRequest);
    }
    @DeleteMapping("/{id}")
    public void delete(@PathVariable long id) {
        alunoService.delete(id);
    }
}